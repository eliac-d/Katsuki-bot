import { randomBytes } from 'crypto';

const LIB_CANDIDATES = [
    '@whiskeysockets/baileys',
    'baileys'
];

const WRAPPERS = [
    'botForwardedMessage',
    'ephemeralMessage',
    'viewOnceMessage',
    'viewOnceMessageV2',
    'viewOnceMessageV2Extension',
    'documentWithCaptionMessage',
    'editedMessage',
    'associatedChildMessage',
    'groupMentionedMessage',
    'botInvokeMessage',
    'statusMentionMessage',
    'questionMessage'
];

const MODE_ALIAS = {
    normal: 'normal',
    n: 'normal',
    inner: 'inner',
    i: 'inner',
    bot: 'bot',
    b: 'bot',
    fwd: 'fwd',
    f: 'fwd',
    directo: 'directo',
    raw: 'directo',
    d: 'directo',
    all: 'all',
    todos: 'all'
};

const ALL_ORDER = ['normal', 'inner', 'bot', 'fwd'];

let libCache = null;

const toBase64 = (buf) => Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const loadLib = async (conn) => {
    if (libCache) return libCache;

    const globals = [global.baileys, global.baileysPackage, global.Baileys].filter(Boolean);
    for (const g of globals) {
        if (g && typeof g === 'object' && g.proto) {
            libCache = g;
            return libCache;
        }
    }

    const names = [...globals.filter((g) => typeof g === 'string'), ...LIB_CANDIDATES];
    for (const name of names) {
        try {
            const mod = await import(name);
            const base = mod.default && typeof mod.default === 'object' ? mod.default : {};
            const lib = { ...base, ...mod };
            if (lib.proto) {
                libCache = lib;
                return libCache;
            }
        } catch {}
    }

    const proto = conn?.proto || conn?.WAProto || global.proto || null;
    libCache = { proto };
    return libCache;
};

const replacer = (key, value) => {
    if (key === 'conn' || key === 'client' || key === 'store') return undefined;
    if (value && value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data).toString('base64');
    if (value instanceof Uint8Array) return toBase64(value);
    if (typeof value === 'object' && value && value.low !== undefined && value.high !== undefined) return value.toNumber ? value.toNumber() : Number(value.low);
    if (typeof value === 'function' || value === '[Circular]') return undefined;
    return value;
};

const safeStringify = (payload) => {
    try {
        return JSON.stringify(payload, replacer, 2);
    } catch {
        const seen = new WeakSet();
        return JSON.stringify(payload, (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) return undefined;
                seen.add(value);
            }
            return replacer(key, value);
        }, 2);
    }
};

const extractPayload = (q) => {
    const msg = q.message || q.msg || {};
    const type = q.mtype || Object.keys(msg)[0];
    const c = msg[type] || q;

    let payload;
    if (q.message && Object.keys(q.message).length > 0) {
        payload = q.message;
    } else if (q.msg && typeof q.msg === 'object' && q.msg !== '[Circular]') {
        payload = { [type]: q.msg };
    } else if (type && c && typeof c === 'object') {
        payload = { [type]: c };
    } else {
        payload = msg;
    }

    return { payload, type: type || 'unknown' };
};

const hasContent = (o) => !!o && typeof o === 'object' && Object.keys(o).some((k) => k !== 'messageContextInfo');

const isPlain = (v) => !!v && typeof v === 'object' && !Buffer.isBuffer(v) && !(v instanceof Uint8Array);

const findQuotedRaw = (roots) => {
    const seen = new WeakSet();
    const walk = (obj, depth) => {
        if (!isPlain(obj) || depth > 6 || seen.has(obj)) return null;
        seen.add(obj);
        try {
            const qm = obj.contextInfo?.quotedMessage;
            if (hasContent(qm)) return qm;
            for (const k of Object.keys(obj)) {
                if (k === 'conn' || k === 'client' || k === 'store' || k === 'quoted') continue;
                const found = walk(obj[k], depth + 1);
                if (found) return found;
            }
        } catch {}
        return null;
    };
    for (const r of roots) {
        const f = walk(r, 0);
        if (f) return f;
    }
    return null;
};

const resolvePayload = (m, q) => {
    const candidates = [];
    const raw = findQuotedRaw([m.message, m.msg, m.fakeObj?.message, m.m?.message, m.messages?.[0]?.message]);
    if (raw) candidates.push({ source: 'contextInfo.quotedMessage', payload: raw });
    if (q) {
        if (q.fakeObj?.message) candidates.push({ source: 'quoted.fakeObj', payload: q.fakeObj.message });
        if (q.vM?.message) candidates.push({ source: 'quoted.vM', payload: q.vM.message });
        candidates.push({ source: 'quoted', payload: extractPayload(q).payload });
    }
    for (const c of candidates) {
        let obj;
        try {
            obj = JSON.parse(safeStringify(c.payload));
        } catch {
            continue;
        }
        if (hasContent(obj)) return { obj, source: c.source };
    }
    return { obj: {}, source: 'none' };
};

const describeQuoted = (m, q) => {
    const keys = (o) => (isPlain(o) ? Object.keys(o).filter((k) => k !== 'conn' && k !== 'client' && k !== 'store').join(', ') || 'vacío' : 'n/a');
    return [
        `mtype: ${q?.mtype ?? 'n/a'}`,
        `quoted: ${keys(q)}`,
        `quoted.message: ${keys(q?.message)}`,
        `quoted.msg: ${keys(q?.msg)}`,
        `quoted.fakeObj.message: ${keys(q?.fakeObj?.message)}`,
        `m.message: ${keys(m.message)}`,
        `m.msg: ${keys(m.msg)}`
    ].join('\n');
};

const tryDecode = (str) => {
    try {
        const text = Buffer.from(str, 'base64').toString('utf8').trim();
        if (!text.startsWith('{') && !text.startsWith('[')) return null;
        return JSON.parse(text);
    } catch {
        return null;
    }
};

const annotate = (v) => {
    if (Array.isArray(v)) {
        v.forEach(annotate);
        return v;
    }
    if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) annotate(v[k]);
        if (typeof v.data === 'string' && v.data.length > 16) {
            const decoded = tryDecode(v.data);
            if (decoded) v.__decoded = decoded;
        }
    }
    return v;
};

const collectPaths = (v, p = '', d = 0, out = []) => {
    if (out.length >= 160 || d > 6) return out;
    if (Array.isArray(v)) {
        out.push(`${p}[${v.length}]`);
        v.slice(0, 2).forEach((x, i) => collectPaths(x, `${p}[${i}]`, d + 1, out));
    } else if (v && typeof v === 'object') {
        for (const k of Object.keys(v)) {
            const np = p ? `${p}.${k}` : k;
            if (v[k] && typeof v[k] === 'object') collectPaths(v[k], np, d + 1, out);
            else out.push(np);
        }
    }
    return out;
};

const clean = (v) => {
    if (Array.isArray(v)) return v.map(clean);
    if (v && typeof v === 'object') {
        const out = {};
        for (const [k, val] of Object.entries(v)) {
            if (k === '__decoded' || val === null || val === undefined) continue;
            out[k] = clean(val);
        }
        return out;
    }
    return v;
};

const parseJson = (txt) => {
    const t = String(txt || '').replace(/```json/gi, '').replace(/```/g, '').trim();
    const s = t.indexOf('{');
    const e = t.lastIndexOf('}');
    if (s === -1 || e === -1 || e < s) throw new Error('No se encontró un JSON válido');
    return JSON.parse(t.slice(s, e + 1));
};

const rootKey = (obj) => Object.keys(obj).find((k) => k !== 'messageContextInfo') || Object.keys(obj)[0] || 'Desconocido';

const normalizeRoot = (raw) => {
    if (raw && raw.key && raw.message && typeof raw.message === 'object') return raw.message;
    return raw;
};

const unwrap = (raw) => {
    let cur = raw;
    for (let i = 0; i < 12; i++) {
        const k = rootKey(cur);
        if (!WRAPPERS.includes(k)) break;
        const inner = cur[k]?.message;
        if (!inner || typeof inner !== 'object') break;
        cur = inner;
    }
    return cur;
};

const wrapBot = (inner) => ({ botForwardedMessage: { message: inner } });

const refreshContext = (lib, inst) => {
    const P = lib.proto;
    const ctx = inst.messageContextInfo || P.MessageContextInfo.create({});
    ctx.deviceListMetadata = P.DeviceListMetadata ? P.DeviceListMetadata.create({}) : {};
    ctx.deviceListMetadataVersion = 2;
    ctx.messageSecret = randomBytes(32);
    inst.messageContextInfo = ctx;
    return inst;
};

const prepare = (lib, obj, refresh = true) => {
    const cleaned = clean(obj);
    if (!lib.proto) return cleaned;
    const inst = lib.proto.Message.fromObject(cleaned);
    if (refresh) refreshContext(lib, inst);
    return inst;
};

const BOT_NODES = [{ tag: 'bot', attrs: { biz_bot: '1' } }];

const buildVariant = (lib, name, raw) => {
    const inner = unwrap(raw);
    switch (name) {
        case 'inner':
            return { message: prepare(lib, inner), nodes: [] };
        case 'bot':
            return { message: prepare(lib, raw), nodes: BOT_NODES };
        case 'fwd':
            return { message: prepare(lib, wrapBot(inner)), nodes: [] };
        case 'directo':
            return { message: prepare(lib, raw, false), nodes: [] };
        default:
            return { message: prepare(lib, raw), nodes: [] };
    }
};

const genId = (lib, conn) => {
    try {
        if (typeof lib.generateMessageIDV2 === 'function') return lib.generateMessageIDV2(conn.user?.id);
        if (typeof lib.generateMessageID === 'function') return lib.generateMessageID();
    } catch {}
    return '3EB0' + randomBytes(9).toString('hex').toUpperCase();
};

const sendVariant = async (conn, lib, jid, name, raw) => {
    const { message, nodes } = buildVariant(lib, name, raw);
    const messageId = genId(lib, conn);
    const opts = { messageId };
    if (nodes.length) opts.additionalNodes = nodes;
    const result = await conn.relayMessage(jid, message, opts);
    return typeof result === 'string' ? result : messageId;
};

const getArgs = (m, ctx) => {
    if (typeof ctx.text === 'string') return ctx.text.trim();
    if (Array.isArray(ctx.args)) return ctx.args.join(' ').trim();
    const t = m.text || m.body || '';
    return String(t).replace(/^\S+\s*/, '').trim();
};

const readQuotedText = async (conn, q) => {
    if (q.mtype === 'documentMessage') {
        const buf = q.download ? await q.download() : await conn.downloadMediaMessage(q);
        return (Buffer.isBuffer(buf) ? buf : Buffer.from(buf)).toString('utf-8');
    }
    return q.text || q.msg?.caption || q.msg?.text || q.body || '';
};

export const inspectAudioModule = {
    category: 'owner',
    commands: {
        gen: {
            name: 'gen',
            alias: ['getcode', 'raw'],
            owner: true,
            run: async (m, ctx) => {
                const { conn } = ctx;
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde a un mensaje', m);

                try {
                    const mode = (getArgs(m, ctx).split(/\s+/)[0] || '').toLowerCase();
                    const { obj, source } = resolvePayload(m, q);
                    const type = rootKey(obj);

                    if (mode === 'debug') {
                        return conn.reply(m.chat, `> *Depuración*\n\nFuente: ${source}\n${describeQuoted(m, q)}`, m);
                    }

                    if (!hasContent(obj)) {
                        return conn.reply(
                            m.chat,
                            `❌ El mensaje llegó vacío. Tu versión de Baileys probablemente no reconoce ese tipo y descartó el contenido al decodificarlo. Actualiza el fork o usa \`.gen debug\` para ver qué recibió el bot.\n\n${describeQuoted(m, q)}`,
                            m
                        );
                    }

                    if (['deep', 'decode', 'd'].includes(mode)) annotate(obj);

                    let out;
                    let ext = 'json';
                    let mime = 'application/json';

                    if (mode === 'min') {
                        out = JSON.stringify(obj);
                    } else if (mode === 'info') {
                        const root = rootKey(obj);
                        const chain = [];
                        let cur = obj;
                        for (let i = 0; i < 12; i++) {
                            const k = rootKey(cur);
                            chain.push(k);
                            const inner = cur[k]?.message;
                            if (!WRAPPERS.includes(k) || !inner) break;
                            cur = inner;
                        }
                        out = `Raíz: ${root}\nFuente: ${source}\nCadena: ${chain.join(' > ')}\n\n${collectPaths(obj).join('\n')}`;
                        ext = 'txt';
                        mime = 'text/plain';
                    } else {
                        out = JSON.stringify(obj, null, 2);
                    }

                    if (out.length > 4000) {
                        await conn.sendMessage(m.chat, {
                            document: Buffer.from(out),
                            mimetype: mime,
                            fileName: `raw_${type}_${Date.now()}.${ext}`
                        }, { quoted: m });
                    } else {
                        const body = ext === 'json' ? `\`\`\`json\n${out}\n\`\`\`` : out;
                        await conn.reply(m.chat, body, m);
                    }
                } catch (e) {
                    await conn.reply(m.chat, `❌ Error: ${e.message}`, m);
                }
            }
        },
        run: {
            name: 'run',
            alias: ['ejecutar'],
            owner: true,
            run: async (m, ctx) => {
                const { conn } = ctx;

                try {
                    const argText = getArgs(m, ctx);
                    const first = (argText.split(/\s+/)[0] || '').toLowerCase();
                    const mode = MODE_ALIAS[first] || 'normal';
                    const rest = MODE_ALIAS[first] ? argText.slice(first.length).trim() : argText;

                    let txt = '';
                    if (rest.includes('{')) {
                        txt = rest;
                    } else {
                        const q = m.quoted;
                        if (!q) return conn.reply(m.chat, '❌ Responde al JSON', m);
                        txt = await readQuotedText(conn, q);
                    }

                    const raw = normalizeRoot(parseJson(txt));
                    const rootType = rootKey(raw);
                    const innerType = rootKey(unwrap(raw));
                    const innerKeys = raw[rootType] && typeof raw[rootType] === 'object'
                        ? Object.keys(raw[rootType]).join(', ')
                        : 'Sin campos internos';

                    const lib = await loadLib(conn);

                    if (mode === 'all') {
                        const lines = [];
                        for (const name of ALL_ORDER) {
                            try {
                                const id = await sendVariant(conn, lib, m.chat, name, raw);
                                lines.push(`• \`${name}\` ✅ \`${id}\``);
                            } catch (e) {
                                lines.push(`• \`${name}\` ❌ ${e.message}`);
                            }
                            await sleep(900);
                        }
                        return conn.reply(m.chat, `> *✎ Variantes enviadas*\n\n${lines.join('\n')}`, m);
                    }

                    const messageId = await sendVariant(conn, lib, m.chat, mode, raw);

                    const infoText = `> *✎ Mensaje procesado correctamente*\n\n` +
                        `*• Estructura Raíz:* \`${rootType}\`\n` +
                        `*• Estructura Interna:* \`${innerType}\`\n` +
                        `*• Campos Internos:* \`${innerKeys}\`\n` +
                        `*• Modo:* \`${mode}\`\n` +
                        `*• Proto:* \`${lib.proto ? 'sí' : 'no'}\`\n` +
                        `*• ID de Mensaje:* \`${messageId || 'N/A'}\``;

                    await conn.reply(m.chat, infoText, m);
                } catch (e) {
                    await conn.reply(m.chat, `❌ Error: ${e.message}`, m);
                }
            }
        }
    }
};
