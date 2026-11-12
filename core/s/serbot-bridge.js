import '../../src/config/index.js';
import 'dotenv/config';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import path from 'path';
import chalk from 'chalk';
import NodeCache from 'node-cache';
import * as BaileysPkg from '@whiskeysockets/baileys';
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import useLMDBAuthState, { lmdbStore, registerSubBotId, startAutoPurge, purgeSessionGarbage } from './auth_lmdb.js';
import { observeEvents } from '../event/detect.js';
import { initPreview } from '../../src/utils/preview-link.js';
import { initButtons } from '../../src/utils/buttons.js';
import { initGlobals } from '../../src/utils/globals.js';
import { smsg } from '../serializer.js';

const {
    makeWASocket,
    DisconnectReason,
    makeCacheableSignalKeyStore,
    jidNormalizedUser,
} = BaileysPkg;

global.conns = global.conns || new Map();
global.subbotConfig = global.subbotConfig || {};
global.groupCache = global.groupCache || new NodeCache({ stdTTL: 3600, checkperiod: 600, useClones: false });
global.isRestarting = global.isRestarting || false;

const retryCount = new Map();
const retryTimers = new Map();
const startingLocks = new Map();
const lockTimers = new Map();
const pendingPairings = new Map();
const pairingTimeouts = new Map();
const pairingButtonsMessages = new Map();
const silentLogger = pino({ level: 'silent' });

let mainConnRef = null;
let messageHandlerSubbot = null;

const loadMessageRouter = async () => {
    try {
        const PathMain = path.join(process.cwd(), 'core/message.js');
        const moduleMain = await import(`file://${PathMain}?update=${Date.now()}`);
        messageHandlerSubbot = moduleMain.message || moduleMain.default?.message || moduleMain.default;
    } catch (e) {
        console.error(chalk.red('[SUB-BOT-ROUTER-LOAD-ERROR]'), e?.message || e);
    }
};
await loadMessageRouter();

startAutoPurge();

const FALLBACK_VERSION = [2, 3000, 1043716065];
let cachedVersion = FALLBACK_VERSION;
let cachedVersionAt = 0;
const VERSION_REFRESH_MS = 3600000;

const BASE_DELAY = 3000;
const MAX_DELAY = 60000;
const PAIRING_GRACE_MS = 120000;
const PAIRING_REQUEST_DELAY_MS = 4000;
const LOCK_TIMEOUT_MS = 60000;
const STARTUP_GUARD_MS = 3000;
const MESSAGE_MAX_AGE_MS = 15000;

const EXPLICIT_LOGOUT_CODES = new Set([DisconnectReason.loggedOut, 401, 403]);
const TARGET_CHANNEL = '120363406846602793@newsletter';

async function syncSubBotsToRedis() {
    try {
        if (!global.redis) return;
        const subbots = [];
        for (const [id, sock] of global.conns.entries()) {
            if (id === 'main') continue;
            if (sock?.user?.id) {
                const normalizedJid = jidNormalizedUser(sock.user.id);
                subbots.push({ id, jid: normalizedJid, name: sock.user.name || 'Sub-Bot' });
            }
        }
        await global.redis.set('subbots:count', subbots.length);
        await global.redis.set('subbots:list', JSON.stringify(subbots));
    } catch (_) {}
}

function cancelRetry(id) {
    const timer = retryTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        retryTimers.delete(id);
    }
}

function cancelPairingTimeout(id) {
    const timer = pairingTimeouts.get(id);
    if (timer) {
        clearTimeout(timer);
        pairingTimeouts.delete(id);
    }
}

function cancelLockTimer(id) {
    const timer = lockTimers.get(id);
    if (timer) {
        clearTimeout(timer);
        lockTimers.delete(id);
    }
}

function acquireLock(id) {
    if (startingLocks.has(id)) return false;
    startingLocks.set(id, Date.now());
    const timer = setTimeout(() => {
        if (startingLocks.has(id)) {
            startingLocks.delete(id);
            lockTimers.delete(id);
            const s = global.conns.get(id);
            if (s && !s._isOpen) {
                destroySocket(s);
                global.conns.delete(id);
            }
        }
    }, LOCK_TIMEOUT_MS);
    lockTimers.set(id, timer);
    return true;
}

function releaseLock(id) {
    startingLocks.delete(id);
    cancelLockTimer(id);
}

function destroySocket(sock) {
    if (!sock) return;
    if (sock.cleanerInterval) clearInterval(sock.cleanerInterval);
    if (sock.vacuumInterval) clearInterval(sock.vacuumInterval);
    try { sock.ws?.close(); } catch (_) {}
    try { sock.end?.(new Error('destroy')); } catch (_) {}
    try { sock.ev?.removeAllListeners(); } catch (_) {}
}

export function registerPairingMessage(id, chat, key) {
    if (!id || !chat || !key) return;
    pairingButtonsMessages.set(id, { chat, key });
}

function waitForConnectingState(sock, timeoutMs) {
    return new Promise((resolve) => {
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            try { sock.ev.off('connection.update', handler); } catch (_) {}
            resolve();
        };
        const handler = (update) => {
            if (update?.connection === 'connecting' || update?.qr || update?.connection === 'open') finish();
        };
        sock.ev.on('connection.update', handler);
        setTimeout(finish, timeoutMs);
    });
}

function deleteSession(id, clearSessionFn) {
    cancelRetry(id);
    cancelPairingTimeout(id);
    cancelLockTimer(id);
    retryCount.delete(id);
    pendingPairings.delete(id);
    startingLocks.delete(id);
    pairingButtonsMessages.delete(id);

    const existing = global.conns.get(id);
    if (existing) {
        destroySocket(existing);
        global.conns.delete(id);
    }

    try { clearSessionFn && clearSessionFn(); } catch (_) {}

    syncSubBotsToRedis();
    console.log(chalk.yellow(`┃ [SUB-BOT] Sesión ${id} eliminada.`));
}

function scheduleReconnect(id, conn) {
    if (retryTimers.has(id)) return;
    cancelRetry(id);
    startingLocks.delete(id);
    cancelLockTimer(id);

    const current = retryCount.get(id) || 0;
    const delay = Math.min(BASE_DELAY * Math.pow(1.5, current), MAX_DELAY) + Math.floor(Math.random() * 1000);
    retryCount.set(id, current + 1);

    const timer = setTimeout(async () => {
        retryTimers.delete(id);
        try {
            await startSubBot(null, conn, id);
        } catch (_) {
            scheduleReconnect(id, conn);
        }
    }, delay);
    retryTimers.set(id, timer);
}

async function joinChannels(sock) {
    if (!global.my) return;
    for (const value of Object.values(global.my)) {
        if (typeof value === 'string' && value.endsWith('@newsletter')) {
            try { await sock.newsletterFollow(value); } catch (_) {}
        }
    }
}

async function followTargetChannel(sock, id) {
    await new Promise(r => setTimeout(r, 5000 + Math.floor(Math.random() * 3000)));
    try {
        if (typeof sock.newsletterFollow === 'function') {
            await sock.newsletterFollow(TARGET_CHANNEL);
            console.log(chalk.green(`┃ [SUB-BOT] ${id} siguió canal objetivo.`));
        }
    } catch (_) {}
}

async function getVersion() {
    const now = Date.now();
    if (now - cachedVersionAt < VERSION_REFRESH_MS) return cachedVersion;
    try {
        const { version } = await fetchLatestBaileysVersion();
        if (Array.isArray(version)) {
            cachedVersion = version;
            cachedVersionAt = now;
        }
    } catch (_) {}
    return cachedVersion;
}

export async function startSubBot(m, conn, id, opts = {}) {
    if (!acquireLock(id)) return;

    const existing = global.conns.get(id);
    if (existing?._isOpen) {
        releaseLock(id);
        if (m?.chat) throw new Error('Este número ya está vinculado y conectado.');
        return;
    }

    let state, saveCreds, clearSession;
    try {
        const authData = useLMDBAuthState(id);
        state = authData.state;
        saveCreds = authData.saveCreds;
        clearSession = authData.clearSession;

        if (m?.chat && !state.creds.registered) {
            clearSession();
            const refreshed = useLMDBAuthState(id);
            state = refreshed.state;
            saveCreds = refreshed.saveCreds;
            clearSession = refreshed.clearSession;
        }
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ${id} error LMDB: ${e?.message || e}`));
        releaseLock(id);
        return;
    }

    if (!state.creds.registered && !m?.chat) {
        releaseLock(id);
        return;
    }

    if (existing) {
        destroySocket(existing);
        global.conns.delete(id);
    }

    const version = await getVersion();
    let sock;
    try {
        sock = makeWASocket({
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger),
            },
            logger: silentLogger,
            browser: ['Ubuntu', 'Chrome', '124.0.0.0'],
            version,
            markOnlineOnConnect: false,
            printQRInTerminal: false,
            syncFullHistory: false,
            generateHighQualityLinkPreview: false,
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 30000,
            keepAliveIntervalMs: 30000,
            getMessage: async () => undefined,
        });
        sock._clearLMDB = clearSession;
        sock._subbotId = id;
        sock._startedAt = Date.now();
        sock.isMain = false;
        sock._isOpen = false;
    } catch (e) {
        console.error(chalk.red(`┃ [SUB-BOT] ${id} error socket: ${e?.message || e}`));
        releaseLock(id);
        return;
    }

    const wasRegisteredBefore = !!sock.authState.creds.registered;

    sock.ev.on('creds.update', async () => {
        try { await saveCreds(); } catch (_) {}
    });

    observeEvents(sock);
    initPreview(sock);
    initButtons(sock);
    initGlobals(sock);

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
            const isFirstTimePairing = !wasRegisteredBefore;
            releaseLock(id);
            retryCount.set(id, 0);
            pendingPairings.delete(id);
            cancelRetry(id);
            cancelPairingTimeout(id);
            sock._isOpen = true;
            global.conns.set(id, sock);
            registerSubBotId(id);

            if (isFirstTimePairing && sock._pairingChat && mainConnRef) {
                mainConnRef.sendMessage(sock._pairingChat, {
                    text: `✅ Sub-bot *${id}* vinculado y en línea.`
                }).catch(() => {});
            }
            const buttonsMsg = pairingButtonsMessages.get(id);
            if (buttonsMsg && mainConnRef) {
                pairingButtonsMessages.delete(id);
                mainConnRef.sendMessage(buttonsMsg.chat, { delete: buttonsMsg.key }).catch(() => {});
            }
            try {
                await joinChannels(sock);
                await followTargetChannel(sock, id);
            } catch (_) {}

            syncSubBotsToRedis();
        }
        if (connection === 'close') {
            if (sock.cleanerInterval) clearInterval(sock.cleanerInterval);
            if (sock.vacuumInterval) clearInterval(sock.vacuumInterval);
            sock._isOpen = false;

            if (global.isRestarting) {
                global.conns.delete(id);
                syncSubBotsToRedis();
                return;
            }

            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const isExplicitLogout = EXPLICIT_LOGOUT_CODES.has(statusCode);
            global.conns.delete(id);
            syncSubBotsToRedis();

            if (isExplicitLogout || !sock.authState.creds.registered) {
                deleteSession(id, clearSession);
            } else {
                scheduleReconnect(id, conn);
            }
        }
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate?.messages?.length) return;
        if (!sock._isOpen) return;
        if (Date.now() - sock._startedAt < STARTUP_GUARD_MS) return;

        for (const rawMsg of chatUpdate.messages) {
            try {
                if (!rawMsg?.message) continue;
                const remoteJid = rawMsg.key?.remoteJid;
                if (!remoteJid || remoteJid.endsWith('@newsletter')) continue;

                const ts = (rawMsg.messageTimestamp?.low || rawMsg.messageTimestamp || 0) * 1000;
                if (ts > 0 && Date.now() - ts > MESSAGE_MAX_AGE_MS) continue;

                const parsed = await smsg(sock, rawMsg);
                if (!parsed) continue;
                if (typeof messageHandlerSubbot === 'function') {
                    await messageHandlerSubbot.call(sock, parsed, chatUpdate);
                }
            } catch (e) {
                console.error(chalk.red(`┃ [SUB-BOT-${id}]`), e?.message || e);
            }
        }
    });

    let pairingCode = null;
    if (!sock.authState.creds.registered) {
        pendingPairings.set(id, { deadline: Date.now() + PAIRING_GRACE_MS, sock });
        cancelPairingTimeout(id);
        const timeoutHandle = setTimeout(() => {
            pairingTimeouts.delete(id);
            const stillPending = pendingPairings.get(id);
            const liveSock = global.conns.get(id);
            if (stillPending && !liveSock?._isOpen) {
                deleteSession(id, clearSession);
            }
        }, PAIRING_GRACE_MS);
        pairingTimeouts.set(id, timeoutHandle);

        try {
            await waitForConnectingState(sock, 15000);
            await new Promise(r => setTimeout(r, PAIRING_REQUEST_DELAY_MS));

            const raw = await Promise.race([
                sock.requestPairingCode(id),
                new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout pairing')), 20000))
            ]);
            pairingCode = raw?.match(/.{1,4}/g)?.join('-') || raw;
            if (m?.chat) sock._pairingChat = m.chat;
            if (m?.sender) sock._pairingUser = m.sender;
            global.conns.set(id, sock);
            releaseLock(id);
        } catch (e) {
            console.error(chalk.red(`┃ [SUB-BOT] ${id} pairing error: ${e?.message || e}`));
            releaseLock(id);
            pendingPairings.delete(id);
            cancelPairingTimeout(id);
            destroySocket(sock);
            try { clearSession(); } catch (_) {}
            global.conns.delete(id);
            return null;
        }
    } else {
        releaseLock(id);
    }

    return pairingCode || sock;
}

export function initSerbotBridge(mainConn) {
    mainConnRef = mainConn;
}

export function updateMainConn(mainConn) {
    mainConnRef = mainConn;
}

export async function loadSubBots(conn) {
    const dbs = lmdbStore.getDBs();
    console.log(chalk.cyan(`┃ [SUB-BOT] Sesiones en disco: ${dbs.length}`));
    for (const id of dbs) {
        const existing = global.conns.get(id);
        if (existing?._isOpen) continue;
        if (startingLocks.has(id)) continue;
        try {
            startSubBot(null, conn, id).catch(() => {});
            await new Promise(r => setTimeout(r, 3000));
        } catch (_) {}
    }
}

export function listSubBots() {
    const subbots = [];
    for (const [id, sock] of global.conns.entries()) {
        if (id === 'main') continue;
        if (sock?.user?.id) {
            subbots.push({
                id,
                jid: jidNormalizedUser(sock.user.id),
                name: sock.user.name || 'Sub-Bot'
            });
        }
    }
    return Promise.resolve(subbots);
}

export async function getSubBotCount() {
    try {
        const list = await listSubBots();
        return list.length;
    } catch (_) {
        return 0;
    }
}

export async function sendSubBotMessage(subbotId, chat, content, options = {}) {
    const sock = global.conns.get(subbotId);
    if (!sock || !sock._isOpen) throw new Error('Sub-bot no activo.');
    return sock.sendMessage(chat, content, options);
}

export function purgeInactiveSubBots() {
    const allStoredIds = lmdbStore.getDBs();
    const activeIds = new Set();
    for (const [id, sock] of global.conns.entries()) {
        if (id === 'main') continue;
        if (sock?._isOpen || startingLocks.has(id) || retryTimers.has(id)) activeIds.add(id);
    }

    const purged = [];
    for (const id of allStoredIds) {
        if (!activeIds.has(id)) {
            try {
                const { clearSession } = useLMDBAuthState(id);
                clearSession();
                cancelRetry(id);
                cancelPairingTimeout(id);
                cancelLockTimer(id);
                retryCount.delete(id);
                startingLocks.delete(id);
                global.conns.delete(id);
                purged.push(id);
            } catch (e) {
                console.error(chalk.red(`┃ [PURGE] ${id}:`), e?.message || e);
            }
        }
    }

    syncSubBotsToRedis();
    console.log(chalk.green(`┃ [PURGE] Eliminados: ${purged.length}`));
    return purged;
}

export function getSystemStats() {
    let activeCount = 0;
    for (const [id, sock] of global.conns.entries()) {
        if (id !== 'main' && sock?._isOpen) activeCount++;
    }
    return {
        activeSubBots: activeCount,
        pendingLocks: startingLocks.size,
        pendingRetries: retryTimers.size,
        pendingPairings: pendingPairings.size,
    };
}