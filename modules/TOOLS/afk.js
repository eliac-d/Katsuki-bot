import { jidNormalizedUser } from '@whiskeysockets/baileys';

global.afkUsers = global.afkUsers || {};
global.afkCooldowns = global.afkCooldowns || {};

function formatDuration(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

    return parts.join(' ');
}


function extractReason(rawText) {
    return rawText
        .replace(/^[°•π÷×¶∆£¢€¥$\%\/#!.]?(afk|inactivo|ausente)[ \t]*/i, '')
        .trim();
}

export const afkModule = {
    commands: {
        afk: {
            name: 'afk',
            alias: ['inactivo', 'ausente'],

            async before(m, { conn }) {
                if (!m.chat || m.fromMe) return false;

                const sender = jidNormalizedUser(m.sender);
                const rawText = (m.text || m.body || m.msg?.text || m.msg?.caption || '').trim();

                const isAfkCommand = /^[°•π÷×¶∆£¢€¥$\%\/#!.]?(afk|inactivo|ausente)(\s|$)/i.test(rawText);

                
                if (global.afkUsers[sender]) {
                    const afkData = global.afkUsers[sender];
                    const now = Date.now();

                    if (!isAfkCommand && (now - afkData.time) > 1000) {
                        const tiempoTexto = formatDuration(now - afkData.time);
                        delete global.afkUsers[sender];

                        await conn.sendMessage(m.chat, {
                            text: `👋 *¡BIENVENIDO DE VUELTA!*\n\n• @${sender.split('@')[0]} ya no está ausente.\n• *Tiempo AFK:* ${tiempoTexto}`,
                            mentions: [sender]
                        }, { quoted: m }).catch(() => null);
                    }
                }

                
                const rawMentions = m.mentionedJid || m.msg?.contextInfo?.mentionedJid || [];
                const targets = rawMentions.map(j => jidNormalizedUser(j));

                if (m.quoted?.sender) {
                    targets.push(jidNormalizedUser(m.quoted.sender));
                }

                const uniqueTargets = [...new Set(targets)].filter(Boolean);
                const afkTargets = uniqueTargets.filter(jid => global.afkUsers[jid] && jid !== sender);

                if (afkTargets.length === 0) return false;

                
                const now = Date.now();
                const cooldownKey = `${m.chat}_${sender}`;
                const lastNotified = global.afkCooldowns[cooldownKey] || 0;

                if (now - lastNotified < 10000) return false;
                global.afkCooldowns[cooldownKey] = now;

                
                const jid = afkTargets[0];
                const afkData = global.afkUsers[jid];
                const tiempoTexto = formatDuration(now - afkData.time);

                const responseText =
                    `📌 *USUARIO NO DISPONIBLE*\n\n` +
                    `Hola @${sender.split('@')[0]}, el usuario que mencionaste está ausente:\n\n` +
                    `• @${jid.split('@')[0]}\n` +
                    `  └ *Motivo:* ${afkData.reason}\n` +
                    `  └ *Tiempo:* hace ${tiempoTexto}`;

                await conn.sendMessage(m.chat, {
                    text: responseText,
                    mentions: [sender, jid]
                }, { quoted: m }).catch(() => null);

                return false;
            },

            run: async (m, { conn, args }) => {
                const userId = jidNormalizedUser(m.sender);
                const rawText = (m.text || m.body || m.msg?.text || m.msg?.caption || '').trim();

                
                let reason = extractReason(rawText);

                
                if (!reason) reason = args.join(' ').trim();
                if (!reason) reason = 'Sin motivo especificado';

                global.afkUsers[userId] = {
                    time: Date.now(),
                    reason: reason
                };

                return conn.sendMessage(m.chat, {
                    text: `💤 *ESTADO AFK ACTIVADO*\n\n` +
                          `• *Usuario:* @${userId.split('@')[0]}\n` +
                          `• *Motivo:* ${reason}\n\n` +
                          `_El bot responderá por ti cuando te mencionen. En cuanto envíes un mensaje, el AFK se desactivará._`,
                    mentions: [userId]
                }, { quoted: m });
            }
        }
    }
};