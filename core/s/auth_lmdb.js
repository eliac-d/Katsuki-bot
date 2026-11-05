import path from 'path';
import fs from 'fs';
import v8 from 'v8';
import { DatabaseSync } from 'node:sqlite';
import { initAuthCreds, proto } from '@whiskeysockets/baileys';

const DB_DIR = path.resolve(process.cwd(), 'sessions');

if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

const db = new DatabaseSync(path.join(DB_DIR, 'subbots.db'));

db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS subbots (id TEXT PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS kv (
        id TEXT NOT NULL,
        key TEXT NOT NULL,
        value BLOB NOT NULL,
        PRIMARY KEY (id, key)
    ) WITHOUT ROWID;
`);

const sGet = db.prepare('SELECT value FROM kv WHERE id = ? AND key = ?');
const sPut = db.prepare('INSERT INTO kv (id, key, value) VALUES (?, ?, ?) ON CONFLICT(id, key) DO UPDATE SET value = excluded.value');
const sDel = db.prepare('DELETE FROM kv WHERE id = ? AND key = ?');
const sKeys = db.prepare('SELECT key FROM kv WHERE id = ?');
const sCount = db.prepare('SELECT COUNT(*) AS total FROM kv WHERE id = ?');
const sClear = db.prepare('DELETE FROM kv WHERE id = ?');
const sDelExceptCreds = db.prepare("DELETE FROM kv WHERE id = ? AND key <> 'creds'");
const sAddId = db.prepare('INSERT OR IGNORE INTO subbots (id) VALUES (?)');
const sDelId = db.prepare('DELETE FROM subbots WHERE id = ?');
const sIds = db.prepare('SELECT id FROM subbots');

const PERSISTED_KEY_TYPES = new Set([
    'session',
    'pre-key',
    'identity-key',
    'sender-key',
    'sender-key-memory',
    'app-state-sync-key',
    'app-state-sync-version',
    'lid-mapping',
    'device-list',
    'tctoken'
]);

const KNOWN_KEY_TYPES = [
    'app-state-sync-version',
    'app-state-sync-key',
    'sender-key-memory',
    'identity-key',
    'device-list',
    'lid-mapping',
    'sender-key',
    'pre-key',
    'session',
    'tctoken'
];

function getKeyType(key) {
    for (const t of KNOWN_KEY_TYPES) {
        if (key.startsWith(`${t}-`)) return t;
    }
    return null;
}

function shouldKeepKey(key) {
    if (key === 'creds') return true;
    const type = getKeyType(key);
    return !!type && PERSISTED_KEY_TYPES.has(type);
}

function encode(value) {
    return v8.serialize(value);
}

function decode(raw) {
    if (raw === undefined || raw === null) return undefined;
    try {
        return v8.deserialize(raw);
    } catch (_) {
        return undefined;
    }
}

function readValue(id, key) {
    const row = sGet.get(id, key);
    return row ? decode(row.value) : undefined;
}

function transaction(fn) {
    db.exec('BEGIN');
    try {
        fn();
        db.exec('COMMIT');
    } catch (e) {
        try { db.exec('ROLLBACK'); } catch (_) {}
        throw e;
    }
}

export function purgeSessionGarbage(id) {
    id = String(id);
    const toRemove = [];
    for (const row of sKeys.all(id)) {
        const k = String(row.key);
        if (k === 'creds') continue;
        if (!shouldKeepKey(k)) toRemove.push(k);
    }
    if (!toRemove.length) return 0;
    transaction(() => {
        for (const k of toRemove) sDel.run(id, k);
    });
    return toRemove.length;
}

export function purgeAllSessionsGarbage() {
    const result = {};
    for (const id of lmdbStore.getDBs()) {
        try {
            result[id] = purgeSessionGarbage(id);
        } catch (e) {
            result[id] = { error: e.message };
        }
    }
    return result;
}

export function purgeAllExceptCreds(id) {
    return Number(sDelExceptCreds.run(String(id)).changes);
}

export function purgeAllSubbotsExceptCreds() {
    const result = {};
    for (const id of lmdbStore.getDBs()) {
        try {
            result[id] = purgeAllExceptCreds(id);
        } catch (e) {
            result[id] = { error: e.message };
        }
    }
    return result;
}

export function startAutoPurge(intervalMs = 6 * 60 * 60 * 1000) {
    const timer = setInterval(() => {
        try {
            const result = purgeAllSubbotsExceptCreds();
            console.log('Limpieza DB:', result);
        } catch (e) {
            console.error('Error en limpieza DB:', e.message);
        }
    }, intervalMs);
    return () => clearInterval(timer);
}

export function registerSubBotId(id) {
    try {
        sAddId.run(String(id));
    } catch (_) {}
}

function unregisterSubBotId(id) {
    try {
        sDelId.run(String(id));
    } catch (_) {}
}

export default function useLMDBAuthState(subbotId) {
    const sid = String(subbotId);

    let creds = readValue(sid, 'creds');
    if (!creds) {
        creds = initAuthCreds();
        sPut.run(sid, 'creds', encode(creds));
    }

    const keys = {
        get: async (type, ids) => {
            const data = {};
            if (!PERSISTED_KEY_TYPES.has(type)) {
                for (const id of ids) data[id] = null;
                return data;
            }
            for (const id of ids) {
                let value = readValue(sid, `${type}-${id}`);
                if (type === 'app-state-sync-key' && value) {
                    value = proto.Message.AppStateSyncKeyData.fromObject(value);
                }
                data[id] = value ?? null;
            }
            return data;
        },
        set: async (data) => {
            transaction(() => {
                for (const category in data) {
                    if (!PERSISTED_KEY_TYPES.has(category)) continue;
                    const bucket = data[category];
                    for (const id in bucket) {
                        const value = bucket[id];
                        const key = `${category}-${id}`;
                        if (value) sPut.run(sid, key, encode(value));
                        else sDel.run(sid, key);
                    }
                }
            });
        }
    };

    return {
        state: { creds, keys },
        saveCreds: () => {
            sPut.run(sid, 'creds', encode(creds));
        },
        clearSession: () => {
            try {
                sClear.run(sid);
            } catch (_) {}
            unregisterSubBotId(sid);
        }
    };
}

export const lmdbStore = {
    getDBs: () => {
        try {
            return sIds.all().map(r => String(r.id));
        } catch (_) {
            return [];
        }
    }
};

export function getLMDBDetails() {
    const records = [];
    for (const id of lmdbStore.getDBs()) {
        try {
            const creds = readValue(id, 'creds');
            records.push({
                id,
                registered: creds ? !!creds.registered : false,
                keysCount: Number(sCount.get(id).total)
            });
        } catch (e) {
            records.push({ id, error: e.message });
        }
    }
    return records;
}

export async function closeLMDB() {
    try {
        db.exec('PRAGMA wal_checkpoint(TRUNCATE)');
        db.close();
    } catch (_) {}
}

process.on('SIGINT', async () => { await closeLMDB(); process.exit(0); });
process.on('SIGTERM', async () => { await closeLMDB(); process.exit(0); });