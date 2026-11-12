import path from 'path';
import { promises as fs } from 'fs';
import chalk from 'chalk';
import { getRealJid } from './identifier.js';
import { dfail } from './event/dfail.js';
import { metricsManager } from './metrics.js';

global.albumStorage = global.albumStorage || new Map();
global.activeAlbumSessions = global.activeAlbumSessions || new Map();

const ALBUM_SESSION_TTL = 5000;
const ALBUM_STORAGE_TTL = 5 * 60 * 1000;
const ALBUM_MAX_ITEMS = 30;
const METADATA_TIMEOUT = 5000;
const REALJID_TIMEOUT = 3000;
const LOCAL_DB_TTL = 5000;
const MESSAGE_MAX_AGE = 15000;

const cleanJid = (jid) => {
    if (!jid) return '';
    const [user, server] = jid.split('@');
    return `${user.split(':')[0]}@${server || 's.whatsapp.net'}`;
};

let _localDbCache = null;
let _localDbCacheAt = 0;

async function getLocalDb() {
    const now = Date.now();
    if (_localDbCache && now - _localDbCacheAt < LOCAL_DB_TTL) return _localDbCache;
    try {
        const dbPath = path.join(process.cwd(), 'database', 'local_db.json');
        const raw = await fs.readFile(dbPath, 'utf-8');
        _localDbCache = JSON.parse(raw);
        _localDbCacheAt = now;
    } catch (_) {}
    return _localDbCache;
}

function invalidateLocalDb() {
    _localDbCache = null;
    _localDbCacheAt = 0;
}

if (!global._albumCleanupInterval) {
    global._albumCleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, session] of global.activeAlbumSessions.entries()) {
            if (now - session.lastTimestamp > ALBUM_SESSION_TTL * 12) {
                global.activeAlbumSessions.delete(key);
            }
        }
        for (const [key, list] of global.albumStorage.entries()) {
            if (!list?.length) {
                global.albumStorage.delete(key);
                continue;
            }
            const last = list[list.length - 1]?.timestamp || 0;
            if (now - last > ALBUM_STORAGE_TTL) {
                global.albumStorage.delete(key);
            }
        }
    }, 60000);
}

if (!global._banCooldownCleanup) {
    global._banCooldownCleanup = setInterval(() => {
        if (!global.banCooldown) return;
        const now = Date.now();
        for (const [key, ts] of global.banCooldown.entries()) {
            if (now - ts > 60000) global.banCooldown.delete(key);
        }
    }, 30000);
}

async function getGroupDataLive(conn, chatJid, cleanSenderId, botJid) {
    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;
    try {
        const md = await Promise.race([
            conn.groupMetadata(chatJid),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), METADATA_TIMEOUT))
        ]).catch(() => null);

        if (!md) return { participants, isAdmin, isBotAdmin };

        participants = md.participants || [];
        const adminRoles = ['admin', 'superadmin'];
        const numSender = cleanSenderId.split('@')[0].replace(/\D/g, '');
        const numBot = botJid.split('@')[0].replace(/\D/g, '');

        for (const p of participants) {
            const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
            const role = p.admin || (p.isSuperAdmin ? 'superadmin' : (p.isAdmin ? 'admin' : null));
            if (pNum === numSender) isAdmin = adminRoles.includes(role);
            if (pNum === numBot) isBotAdmin = adminRoles.includes(role);
        }
    } catch (_) {}
    return { participants, isAdmin, isBotAdmin };
}

export async function message(m, chatUpdate) {
    this.uptime = this.uptime || Date.now();
    const conn = this;
    if (!m || !conn?.user) return;

    try {
        const imgMsg = m.message?.imageMessage || m.msg?.imageMessage;
        const vidMsg = m.message?.videoMessage || m.msg?.videoMessage;
        const stkMsg = m.message?.stickerMessage || m.msg?.stickerMessage;
        const mediaMsg = imgMsg || vidMsg || stkMsg;

        if (mediaMsg) {
            const mediaType = imgMsg ? 'image' : vidMsg ? 'video' : 'sticker';
            const selfId = m.key?.id;
            const sender = m.sender;
            const chat = m.chat;
            const now = Date.now();

            const contextInfo = mediaMsg.contextInfo || m.msg?.contextInfo || {};
            const messageContext = m.message?.messageContextInfo || m.msg?.messageContextInfo || {};

            let explicitParentId = contextInfo.parentMessageKey?.id
                || contextInfo.associatedChildMessageKey?.id
                || messageContext.parentMessageKey?.id
                || messageContext.messageAssociation?.parentMessageKey?.id
                || null;

            const sessionKey = `${chat}_${sender}`;
            const activeSession = global.activeAlbumSessions.get(sessionKey);
            let albumParentId = explicitParentId;

            if (!albumParentId) {
                if (activeSession && (now - activeSession.lastTimestamp < 4000)) {
                    albumParentId = activeSession.parentId;
                    activeSession.lastTimestamp = now;
                } else {
                    albumParentId = selfId;
                    global.activeAlbumSessions.set(sessionKey, { parentId: selfId, lastTimestamp: now });
                }
            } else {
                global.activeAlbumSessions.set(sessionKey, { parentId: albumParentId, lastTimestamp: now });
            }

            const itemData = {
                id: selfId,
                parentId: albumParentId,
                type: mediaType,
                mtype: m.mtype || (imgMsg ? 'imageMessage' : vidMsg ? 'videoMessage' : 'stickerMessage'),
                sender,
                caption: mediaMsg.caption || m.text || '',
                timestamp: now,
                msg: mediaMsg,
                message: m.message || { [imgMsg ? 'imageMessage' : vidMsg ? 'videoMessage' : 'stickerMessage']: mediaMsg }
            };

            let existingList = global.albumStorage.get(albumParentId);
            if (!existingList) {
                for (const [k, list] of global.albumStorage.entries()) {
                    if (list.some(i => i.parentId === albumParentId || i.id === albumParentId)) {
                        existingList = list;
                        albumParentId = k;
                        break;
                    }
                }
            }
            if (!existingList) {
                existingList = [];
                global.albumStorage.set(albumParentId, existingList);
            }
            if (!existingList.some(item => item.id === selfId) && existingList.length < ALBUM_MAX_ITEMS) {
                existingList.push(itemData);
            }
            global.albumStorage.set(albumParentId, existingList);
            global.albumStorage.set(selfId, existingList);
        }
    } catch (_) {}

    try { metricsManager.trackMessage(m); } catch (_) {}

    const botJid = cleanJid(conn.user.id);
    const currentChatJid = cleanJid(m.chat);
    if (!m.isGroup && currentChatJid === botJid) return;

    const mTimestamp = (m.messageTimestamp?.low || m.messageTimestamp || 0) * 1000;
    const isViewOnceMsg = !!m.isViewOnce || !!m.key?.isViewOnce || !!m.msg?.viewOnce;
    if (!isViewOnceMsg && mTimestamp > 0 && (Date.now() - mTimestamp > MESSAGE_MAX_AGE)) return;

    const isMainBot = botJid === (global.conn?.user?.id ? cleanJid(global.conn.user.id) : '');

    let realSenderId;
    try {
        realSenderId = await Promise.race([
            getRealJid(conn, m.sender, m),
            new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), REALJID_TIMEOUT))
        ]);
    } catch (_) {
        realSenderId = m.sender;
    }

    const localDb = await getLocalDb();

    let customPrefixes = null;
    if (localDb?.prefixes?.[botJid]) customPrefixes = localDb.prefixes[botJid];

    conn.settings = {
        prefix: customPrefixes || ['.', '#', '/', '!'],
        modulos: { antiprivado: false }
    };

    if (typeof m.text !== 'string') m.text = '';

    const activePrefixes = Array.isArray(conn.settings.prefix)
        ? conn.settings.prefix
        : [conn.settings.prefix];

    const usedPrefix = activePrefixes.find(p => m.text.startsWith(p));

    const sender = m.sender || '';
    if (!sender.endsWith('@s.whatsapp.net') && !sender.endsWith('@lid') && !sender.endsWith('@newsletter')) return;

    const cleanSenderId = cleanJid(realSenderId);
    const senderNumber = cleanSenderId.split('@')[0];

    const isROwner = global.owner ? global.owner.some(ownerItem => {
        if (!ownerItem) return false;
        if (Array.isArray(ownerItem)) {
            return ownerItem[0] ? ownerItem[0].replace(/\D/g, '') === senderNumber : false;
        }
        if (typeof ownerItem === 'string') return ownerItem.replace(/\D/g, '') === senderNumber;
        return false;
    }) : false;

    if (!m.isGroup && !isROwner && !m.chat.endsWith('@newsletter')) return;

    const isSelf = cleanSenderId === botJid || m.fromMe;

    let chat = null;
    let user = null;
    let initialUserSnapshot = null;

    try {
        if (m.isGroup && global.Chat) {
            chat = await global.Chat.findOne({ id: m.chat }).lean().catch(() => null);
            if (!chat) {
                chat = await global.Chat.create({
                    id: m.chat, isBanned: false, welcome: true, muto: false,
                    antiLink: false, antiLink2: false, antiCall: false, modoadmin: false,
                    antisub: false, detect: true, antiBots: false, mutos: [], nsfw: false,
                    autoresponder: false, antiToxic: false, warns: [], botAsignado: ''
                }).catch(() => null);
            }
        }

        if (global.userCache && global.User) {
            user = global.userCache.get(realSenderId);
            if (!user && (usedPrefix || m.isGroup || m.chat.endsWith('@newsletter'))) {
                user = await global.User.findOne({ id: realSenderId }).lean().catch(() => null);
                if (!user && usedPrefix) {
                    user = await global.User.create({
                        id: realSenderId, name: m.pushName || 'Usuario',
                        warnAntiLink: 0, banned: false, lastSeen: new Date()
                    }).catch(() => null);
                }
                if (user) global.userCache.set(realSenderId, user);
            }
            if (user) initialUserSnapshot = JSON.stringify(user);
        }
    } catch (_) {}

    const checkCmd = usedPrefix
        ? m.text.slice(usedPrefix.length).trim().split(/\s+/)[0].toLowerCase()
        : m.text.trim().split(/\s+/)[0].toLowerCase();

    const isPingSubbotsCmd = usedPrefix && (checkCmd === '22' || checkCmd === '2222');
    if (m.isGroup && isPingSubbotsCmd && isROwner) {
        await conn.sendMessage(m.chat, { text: 'Activo' }, { quoted: m }).catch(() => null);
        return;
    }

    if (m.isGroup && chat?.botAsignado && chat.botAsignado !== botJid && !isMainBot) return;

    let participants = [];
    let isAdmin = false;
    let isBotAdmin = false;

    if (m.isGroup) {
        const liveData = await getGroupDataLive(conn, m.chat, cleanSenderId, botJid);
        participants = liveData.participants;
        isAdmin = liveData.isAdmin;
        isBotAdmin = liveData.isBotAdmin;
    }

    if (m.isGroup && chat && !isROwner) {
        if (chat.muto || (chat.mutos && chat.mutos.includes(realSenderId))) {
            if (isBotAdmin) {
                await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                return;
            }
        }
    }

    if (m.isGroup && chat?.antisub && !isMainBot) return;

    if (global.commands) {
        for (const plugin of global.commands.values()) {
            if (plugin && typeof plugin.before === 'function') {
                try {
                    const blockExecution = await plugin.before.call(conn, m, {
                        conn, isOwner: isROwner, chat, user, isROwner,
                        isAdmin, isBotAdmin, participants, isSelf,
                        settings: conn.settings || {}
                    });
                    if (blockExecution === true) return;
                } catch (_) {}
            }
        }
    }

    let commandName = null;
    let cmd = null;

    if (global.commands) {
        if (global.commands.has(checkCmd)) {
            commandName = checkCmd;
            cmd = global.commands.get(checkCmd);
        } else if (global.aliases && global.aliases.has(checkCmd)) {
            commandName = global.aliases.get(checkCmd);
            cmd = global.commands.get(commandName);
        }
    }

    if (localDb?.vip === true && cmd) {
        const cmdCategory = (cmd.category || '').toUpperCase();
        const cmdFolder = (cmd.folder || '').toUpperCase();
        if (cmdCategory === 'SUBBOTS' || cmdFolder === 'SUBBOTS') {
            return;
        }
    }

    if (!isROwner && localDb) {
        const restrictedKey = localDb[checkCmd]
            ? checkCmd
            : (commandName && localDb[commandName] ? commandName : null);
        if (restrictedKey) {
            await conn.sendMessage(m.chat, {
                text: `⚠️ *COMANDO RESTRINGIDO*\n\n*Razón:* ${localDb[restrictedKey].razon}`
            }, { quoted: m }).catch(() => null);
            return;
        }
    }

    const isActualCommand = !!cmd;
    const esComandoLibre = cmd?.libre === true;

    if (!usedPrefix && !isActualCommand) return;
    if (!usedPrefix && isActualCommand && !esComandoLibre) return;

    if (user?.banned && !isROwner) {
        if (!global.banCooldown) global.banCooldown = new Map();
        const now = Date.now();
        if (now - (global.banCooldown.get(m.sender) || 0) > 30000) {
            global.banCooldown.set(m.sender, now);
            await conn.sendMessage(m.chat, {
                text: `⚠ *ACCESO RESTRINGIDO*${user.banReason ? `\n\n*Razón:* ${user.banReason}` : ''}`
            }, { quoted: m }).catch(() => null);
        }
        return;
    }

    if (m.isGroup && chat?.modoadmin && !isROwner && !isAdmin) return;

    let noPrefix = usedPrefix ? m.text.slice(usedPrefix.length).trim() : m.text.trim();

    const isButtonInteraction = (m.mtype === 'templateButtonReplyMessage' || m.mtype === 'interactiveResponseMessage');
    if (!usedPrefix && isButtonInteraction) {
        noPrefix = noPrefix.startsWith('.') ? noPrefix.slice(1) : noPrefix;
    }

    const spaceIndex = noPrefix.search(/[\s\n]/);
    let command = '';
    let text = '';
    let args = [];

    if (spaceIndex === -1) {
        command = noPrefix.toLowerCase();
    } else {
        command = noPrefix.slice(0, spaceIndex).toLowerCase();
        text = noPrefix.slice(spaceIndex).trim();
        args = text.split(/\s+/).filter(Boolean);
    }

    if (!m.isGroup && !m.chat.endsWith('@newsletter') && conn.settings?.modulos?.antiprivado && isActualCommand && !isROwner && !isSelf) {
        const txtAntiPrivado = `> ❒ *SISTEMA ANTI-PRIVADO*\n\nHola @${m.sender.split('@')[0]}, las funciones están disponibles únicamente en grupos.\n\n*Serás bloqueado automáticamente.*`;
        await conn.sendMessage(m.chat, {
            text: txtAntiPrivado,
            contextInfo: { mentionedJid: [m.sender] }
        }, { quoted: m }).catch(() => null);
        await conn.updateBlockStatus(realSenderId, 'block').catch(() => null);
        return;
    }

    if (chat?.isBanned && command !== 'bot' && command !== 'enable' && command !== 'onchat') return;

    if (typeof global.isCommandAllowed === 'function' && global.commands && !global.isCommandAllowed(conn, commandName)) return;

    if (!cmd) return;

    if (cmd.mainOnly && !isMainBot) {
        await conn.sendMessage(m.chat, { text: '❒ Este comando solo funciona en el bot principal.' }, { quoted: m }).catch(() => null);
        return;
    }

    const checkPermissions = (perm) => ({
        rowner: isROwner, owner: isROwner, group: m.isGroup,
        botAdmin: isBotAdmin, admin: isAdmin,
        private: !m.isGroup, self: isSelf || isROwner
    }[perm]);

    if (cmd.nsfw && !chat?.nsfw) {
        dfail('nsfw', m, conn);
        return;
    }

    for (const perm of ['rowner', 'owner', 'group', 'botAdmin', 'admin', 'private', 'self']) {
        if (cmd[perm] && !checkPermissions(perm)) {
            dfail(perm, m, conn);
            return;
        }
    }

    try {
        await conn.readMessages([m.key]).catch(() => null);
        await conn.sendPresenceUpdate('composing', m.chat).catch(() => null);

        const startTime = Date.now();

        if (cmd.run && typeof cmd.run === 'function') {
            await cmd.run.call(conn, m, {
                usedPrefix, noPrefix, args, command: checkCmd, text,
                conn, user, chat, isROwner, isAdmin, isBotAdmin,
                participants, isSelf, settings: conn.settings || {}
            });
        }

        const executionTime = Date.now() - startTime;
        try { metricsManager.trackCommand(commandName || checkCmd, realSenderId, m.chat, true, executionTime); } catch (_) {}

        await conn.sendPresenceUpdate('paused', m.chat).catch(() => null);

        if (user && usedPrefix && global.userCache) {
            global.userCache.set(realSenderId, user);
            const finalSnapshot = JSON.stringify(user);
            if (initialUserSnapshot !== finalSnapshot && typeof global.updateUser === 'function') {
                global.updateUser(realSenderId, user);
            }
        }
    } catch (e) {
        try { metricsManager.trackCommand(commandName || checkCmd, realSenderId, m.chat, false, 0); } catch (_) {}
        await conn.sendPresenceUpdate('paused', m.chat).catch(() => null);
        const errorReport = `❌ *ERROR INTERNO*\n\n` +
            `• *Comando:* ${commandName || 'Desconocido'}\n` +
            `• *Error:* ${e.message}\n\n` +
            `\`\`\`${e.stack}\`\`\``;
        try {
            await conn.sendMessage(m.chat, { text: errorReport }, { quoted: m });
        } catch (_) {}
    }
}

export { invalidateLocalDb };