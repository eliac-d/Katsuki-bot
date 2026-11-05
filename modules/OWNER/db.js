import { existsSync, promises as fs } from 'fs';
import path from 'path';

const SUBBOTS_DIR = path.resolve('./sessions/subbots');
const MAX_CHARS = 3500;

const fmt = (n) => {
    if (!n) return '0 B';
    if (n < 1024) return `${n} B`;
    if (n < 1048576) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1048576).toFixed(2)} MB`;
};

const cut = (t) => (t.length > MAX_CHARS ? `${t.slice(0, MAX_CHARS)}\n…` : t);

const isLive = (id) => !!global.conns?.get(id)?._isOpen;

const getSessionDirs = () => {
    if (!existsSync(SUBBOTS_DIR)) return [];
    return fs.readdirSync(SUBBOTS_DIR).filter(f => {
        const fp = path.join(SUBBOTS_DIR, f);
        return existsSync(fp) && fs.lstatSync(fp).isDirectory() && existsSync(path.join(fp, 'creds.json'));
    });
};

const readCreds = async (id) => {
    const credsPath = path.join(SUBBOTS_DIR, id, 'creds.json');
    if (!existsSync(credsPath)) return null;
    try {
        const content = await fs.readFile(credsPath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return null;
    }
};

const countSessionFiles = async (id) => {
    const dir = path.join(SUBBOTS_DIR, id);
    if (!existsSync(dir)) return 0;
    try {
        const files = await fs.readdir(dir);
        return files.length;
    } catch {
        return 0;
    }
};

const helpText = () => [
    '> ♛  *GESTOR DE SESIONES SUB-BOTS*',
    '',
    '✦  *.db* → resumen general',
    '✦  *.db ls* → listar sesiones',
    '✦  *.db info <id>* → detalle de una sesión',
    '✦  *.db borrar <id>* → eliminar sesión (requiere force si está conectado)',
    '',
    '_Agrega *force* al final para operar sobre sub-bots conectados._'
].join('\n');

const summary = async () => {
    const dirs = getSessionDirs();
    const lines = ['> ♛  *SESIONES SUB-BOTS — RESUMEN*', ''];

    lines.push(`✧  *Carpeta:* ${SUBBOTS_DIR}`);
    lines.push(`✧  *Total sesiones:* ${dirs.length}`);
    lines.push('');

    for (const id of dirs) {
        const creds = await readCreds(id);
        const fileCount = await countSessionFiles(id);
        const estado = isLive(id) ? '🟢' : '🔴';
        const reg = creds?.registered ? 'reg' : 'no-reg';
        lines.push(`${estado} *${id}* · ${reg}`);
        lines.push(`   archivos: ${fileCount}`);
        if (creds) {
            lines.push(`   nextPreKeyId: ${creds.nextPreKeyId ?? 'n/a'} · firstUnuploaded: ${creds.firstUnuploadedPreKeyId ?? 'n/a'}`);
        }
    }

    return cut(lines.join('\n'));
};

const listFiles = async () => {
    if (!existsSync(SUBBOTS_DIR)) return '> No existe la carpeta sessions/subbots.';
    const dirs = getSessionDirs();
    const lines = ['> ♛  *SESIONES EN sessions/subbots*', ''];
    for (const id of dirs) {
        const creds = await readCreds(id);
        const fileCount = await countSessionFiles(id);
        const estado = isLive(id) ? '🟢' : '🔴';
        const reg = creds?.registered ? 'reg' : 'no-reg';
        lines.push(`${estado} ${id} · ${reg} · ${fileCount} archivos`);
    }
    return cut(lines.join('\n'));
};

const infoText = async (id) => {
    const creds = await readCreds(id);
    if (!creds) return `> Sesión ${id} no encontrada o sin creds.json.`;
    const fileCount = await countSessionFiles(id);
    const lines = [`> ♛  *INFO ${id}*`, ''];
    lines.push(`✧  *Estado:* ${isLive(id) ? 'conectado' : 'desconectado'}`);
    lines.push(`✧  *Archivos:* ${fileCount}`);
    lines.push(`✧  *Registrado:* ${creds.registered}`);
    lines.push(`✧  *registrationId:* ${creds.registrationId ?? 'n/a'}`);
    lines.push(`✧  *me:* ${creds.me?.id || 'n/a'}`);
    lines.push(`✧  *signedPreKeyId:* ${creds.signedPreKey?.keyId ?? 'n/a'}`);
    lines.push(`✧  *nextPreKeyId:* ${creds.nextPreKeyId ?? 'n/a'}`);
    lines.push(`✧  *firstUnuploadedPreKeyId:* ${creds.firstUnuploadedPreKeyId ?? 'n/a'}`);
    lines.push(`✧  *accountSyncCounter:* ${creds.accountSyncCounter ?? 'n/a'}`);
    return cut(lines.join('\n'));
};

const deleteSession = async (id, force) => {
    if (isLive(id) && !force) {
        return `⚠️ *${id}* conectado, omitido (usa *force*)`;
    }
    const sessionDir = path.join(SUBBOTS_DIR, id);
    if (!existsSync(sessionDir)) {
        return `❌ *${id}* no existe.`;
    }
    try {
        await fs.rm(sessionDir, { recursive: true, force: true });
        if (global.conns?.has(id)) {
            const sock = global.conns.get(id);
            try { sock.ev?.removeAllListeners(); } catch (_) {}
            try { sock.end?.(); } catch (_) {}
            global.conns.delete(id);
        }
        return `✅ *${id}* → sesión eliminada`;
    } catch (e) {
        return `❌ *${id}* → ${e.message}`;
    }
};

export const lmdbDebugModule = {
    category: 'owner',
    commands: {
        db: {
            name: 'db',
            alias: ['lmdb', 'depurardb', 'exploredb'],
            run: async (m, ctx) => {
                if (!ctx.isROwner) return;

                const raw = (ctx.text ?? (Array.isArray(ctx.args) ? ctx.args.join(' ') : '') ?? '').trim();
                const tokens = raw.split(/\s+/).filter(Boolean);
                const force = tokens[tokens.length - 1]?.toLowerCase() === 'force';
                if (force) tokens.pop();

                const sub = (tokens[0] || '').toLowerCase();
                const a = tokens[1];

                try {
                    await m.react('🔎');
                    let out;

                    switch (sub) {
                        case '':
                        case 'resumen':
                            out = await summary();
                            break;
                        case 'ls':
                        case 'archivos':
                            out = await listFiles();
                            break;
                        case 'info':
                            out = a ? await infoText(a) : helpText();
                            break;
                        case 'borrar':
                        case 'delete':
                            out = a ? await deleteSession(a, force) : helpText();
                            break;
                        default:
                            out = helpText();
                    }

                    if (out) await m.reply(out);
                    await m.react('✅');
                } catch (e) {
                    await m.reply(`> Error: ${e?.message || e}`);
                    await m.react('❌');
                }
            }
        }
    }
};