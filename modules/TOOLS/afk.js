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

export const afkModule = {
    commands: {
        afk: {
            name: 'afk',
            alias: ['inactivo', 'ausente'],

            async before(m, { conn }) {
                if (!m.chat || m.fromMe) return false;

                const sender = jidNormalizedUser(m.sender);
                const rawText = (m.text || m.body || m.msg?.text || m.msg?.caption || '').trim();

                const isAfkCommand = /^[°•π÷×¶∆£¢€¥$\%\/#!.]?(afk\vert{}inactivo\vert{}ausente)(\s+\vert{}$)/i.test(rawText);

                if (global.afkUsers[sender]) {
                    const afkData = global.afkUsers[sender];
                    const now = Date.now();

                    if (!isAfkCommand && (now - afkData.time) > 1000) {
                        const elapsed = now - afkData.time;
                        const tiempoTexto = formatDuration(elapsed);
                        delete global.afkUsers[sender];

                        await conn.sendMessage(m.chat, {
                            text: `👋 *¡BIENVENIDO DE VUELTA!*\n\n• @${sender.split('@')[0]} ya no está ausente.\n• *Tiempo AFK:* ${tiempoTexto}`,
                            mentions: [sender]
                        }, { quoted: m }).catch(() => null);
                    }
                }

                const rawMentions = m.mentionedJid || m.msg?.contextInfo?.mentionedJid || [];
                const targets = rawMentions.map(j => jidNormalizedUser(j));

                const ctxInfo = m.msg?.contextInfo || m.message?.extendedTextMessage?.contextInfo;
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

                const mentionsArray = [sender];
                let responseText = `📌 *USUARIO(S) NO DISPONIBLE(S)*\n\nHola @${sender.split('@')[0]}, los siguientes usuarios están ausentes:\n\n`;

                for (const jid of afkTargets) {
                    const afkData = global.afkUsers[jid];
                    const tiempoTexto = formatDuration(now - afkData.time);

                    responseText += `• @${jid.split('@')[0]}\n`;
                    responseText += `  └ *Motivo:* ${afkData.reason}\n`;
                    responseText += `  └ *Tiempo:* hace ${tiempoTexto}\n\n`;

                    mentionsArray.push(jid);
                }

                await conn.sendMessage(m.chat, {
                    text: responseText.trim(),
                    mentions: mentionsArray
                }, { quoted: m }).catch(() => null);

                return false;
            },

            run: async (m, { conn, args }) => {
                const userId = jidNormalizedUser(m.sender);
                const reason = args.join(' ').trim() || 'Sin motivo especificado';

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
