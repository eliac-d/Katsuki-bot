import { jidNormalizedUser } from '@whiskeysockets/baileys';

const cooldowns = new Map();
const fingerprints = new Map();
const COOLDOWN_MS = 60_000;
const DUP_WINDOW_MS = 300_000;
const MIN_RAW = 25;
const MIN_USEFUL = 12;
const BANNED = ['hola', 'xd', 'jaja', 'como estas', 'ayudaaaa', 'test'];

const sanitize = (t) => t
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/@\d+/g, ' ')
    .replace(/\bspam\b/gi, ' ')
    .replace(/\d+/g, ' ')
    .replace(/[^\p{L}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function isRelevant(text, sender, chatId) {
    if (text.length < MIN_RAW) return false;
    const norm = text.toLowerCase();
    if (BANNED.some(p => norm.includes(p))) return false;

    const useful = sanitize(text);
    if (useful.length < MIN_USEFUL) return false;

    const key = `${sender}:${chatId}`;
    const prev = fingerprints.get(key);
    const now = Date.now();
    if (prev && now - prev.ts < DUP_WINDOW_MS && prev.content === useful) return false;
    fingerprints.set(key, { ts: now, content: useful });
    return true;
}

function parseReport(content) {
    return {
        userJid: content.split('⊛ Usuario: @')[1]?.split('\n')[0]?.trim() + '@s.whatsapp.net',
        chatId: content.split('⌬ Chat ID: ')[1]?.split('\n')[0]?.trim(),
        msgId: content.split('◈ MSG ID: ')[1]?.split('\n')[0]?.trim(),
        botJid: content.split('🤖 Bot JID: ')[1]?.split('\n')[0]?.trim(),
        message: content.split('⊛ Mensaje: ')[1]?.split('\n')[0]?.trim() || 'Reporte'
    };
}

function resolveConn(conn, botJid) {
    if (!botJid) return conn;
    const current = conn.user.id.split(':')[0];
    const target = botJid.split(':')[0];
    if (target === current) return conn;
    const sub = Array.from(global.conns.values()).find(c => c.user && c.user.id.split(':')[0] === target);
    return sub || null;
}

export const reportCommand = {
    category: 'main',
    commands: {
        reporte: {
            name: 'reporte',
            alias: ['report', 'bug', 'idea', 'responder', 'reply', 'r'],
            run: async (m, { conn, text, command, isROwner }) => {
                if (['responder', 'reply', 'r'].includes(command)) {
                    if (!isROwner) return m.reply('Solo desarrolladores.');
                    if (!m.quoted) return m.reply('⚠ Etiqueta el reporte para responder.');

                    const quoted = m.quoted.text || m.quoted.caption || '';
                    if (!quoted.includes('「 NUEVO REPORTE RECIBIDO 」')) return m.reply('⚠ No es un reporte válido.');

                    try {
                        const { userJid, chatId, msgId, botJid, message } = parseReport(quoted);
                        if (!userJid || !chatId || !msgId) return m.reply('⚠ Datos de destino ilegibles.');

                        const targetConn = resolveConn(conn, botJid);
                        if (!targetConn) return m.reply('☒ El sub-bot que recibió este reporte no está activo.');

                        const mime = (m.msg || m).mimetype || '';
                        const body = `⌬ RESPUESTA DEL DESARROLLADOR\n\n${text || ''}`;

                        const content = /image|video/.test(mime)
                            ? { [mime.split('/')[0]]: await m.download(), caption: body, mentions: [userJid] }
                            : { text: body, mentions: [userJid] };

                        await targetConn.sendMessage(chatId, content, {
                            quoted: {
                                key: { remoteJid: chatId, fromMe: false, id: msgId, participant: userJid },
                                message: { conversation: message }
                            }
                        });

                        return m.reply(`✓ Respuesta enviada vía ${targetConn.isSub ? 'Sub-Bot' : 'Principal'}.`);
                    } catch (e) {
                        return m.reply('☒ Error: ' + e.message);
                    }
                }

                const now = Date.now();
                const last = cooldowns.get(m.sender);
                if (last && now - last < COOLDOWN_MS) {
                    const rest = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
                    return m.reply(`⚠ Espera ${rest}s antes de enviar otro reporte.`);
                }

                const q = m.quoted || m;
                const mime = (q.msg || q).mimetype || '';
                const reportText = (text || (m.quoted ? (m.quoted.text || m.quoted.caption || '') : '')).trim();

                if (!reportText) return m.reply('⚠ El reporte no puede estar vacío.');
                if (!isRelevant(reportText, m.sender, m.chat)) {
                    return m.reply('⚠ Reporte rechazado: contenido irrelevante, mención vacía o spam.');
                }

                cooldowns.set(m.sender, now);

                try {
                    const media = mime && /image|video/.test(mime) ? await q.download() : null;
                    const developers = Array.isArray(global.dev1) ? global.dev1 : [global.dev1];

                    const reportMsg = `「 NUEVO REPORTE RECIBIDO 」\n\n` +
                        `⊛ Tipo: ${command.toUpperCase()}\n` +
                        `⊛ Usuario: @${m.sender.split('@')[0]}\n` +
                        `⊛ Nombre: ${m.pushName || 'Usuario'}\n` +
                        `⌬ Chat ID: ${m.chat}\n` +
                        `◈ MSG ID: ${m.key.id}\n` +
                        `🤖 Bot JID: ${conn.user.id}\n` +
                        `⊛ Mensaje: ${reportText}`;

                    await Promise.all(developers.map(dev => {
                        const jid = jidNormalizedUser(dev.includes('@') ? dev : `${dev}@s.whatsapp.net`);
                        return media
                            ? conn.sendMessage(jid, { [mime.split('/')[0]]: media, caption: reportMsg, mentions: [m.sender] })
                            : conn.sendMessage(jid, { text: reportMsg, mentions: [m.sender] });
                    }));

                    await m.reply('✓ Reporte enviado al Centro de Control.');
                } catch (err) {
                    await m.reply('☒ Error: ' + err.message);
                }
            }
        }
    }
};