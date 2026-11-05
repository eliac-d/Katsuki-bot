import { metricsManager } from '../../core/metrics.js';

export const metricsModule = {
    category: 'owner',
    commands: {
        metrics: {
            name: 'metrics',
            alias: ['metricas', 'statsbot'],
            rowner: true,
            run: async (m, { conn }) => {
                const stats = metricsManager.getStats();
                const daysKeys = Object.keys(stats.days || {}).sort().reverse();

                if (daysKeys.length === 0) {
                    return m.reply('❌ No hay métricas registradas en los últimos 3 días.');
                }

                let txt = `📊 *ESTADÍSTICAS Y MÉTRICAS DEL BOT* 📊\n\n`;

                for (const dateStr of daysKeys) {
                    const dayData = stats.days[dateStr];
                    txt += `╭─────────────\n`;
                    txt += `│ 📅 *Fecha:* ${dateStr}\n`;
                    txt += `│ 💬 *Mensajes Totales:* ${dayData.totalMessages || 0}\n`;
                    txt += `│ ⚡ *Comandos Usados:* ${dayData.totalCommands || 0}\n`;
                    txt += `│ 👥 *Usuarios Activos:* ${dayData.activeUsers ? dayData.activeUsers.length : 0}\n`;
                    txt += `│ 🌐 *Chats Activos:* ${dayData.activeChats ? dayData.activeChats.length : 0}\n`;
                    txt += `│ ⚠️ *Errores:* ${dayData.errorsCount || 0}\n`;
                    txt += `│ ⏱️ *Tiempo Resp. Promedio:* ${dayData.avgResponseTimeMs || 0} ms\n`;
                    
                    txt += `│\n│ 🏆 *Top Comandos:* \n`;
                    const topCmds = Object.entries(dayData.commandsUsage || {})
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 5);

                    if (topCmds.length === 0) {
                        txt += `│   └ (Sin uso de comandos)\n`;
                    } else {
                        topCmds.forEach(([cmdName, count], idx) => {
                            txt += `│   ${idx + 1}. .${cmdName} ➔ ${count}\n`;
                        });
                    }

                    txt += `╰─────────────\n\n`;
                }

                const thumb = typeof global.img === 'function' ? global.img(conn) : (typeof img === 'function' ? img(conn) : 'https://dix.lat');

                await conn.sendMessage(m.chat, {
                    image: { url: thumb },
                    caption: txt.trim()
                }, { quoted: m });
            }
        }
    }
};
