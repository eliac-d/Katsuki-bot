import { createCanvas } from '@napi-rs/canvas';
import { metricsManager } from '../../core/metrics.js';

export const metricsModule = {
    category: 'owner',
    commands: {
        metrics: {
            name: 'metrics',
            alias: ['metricas', 'statsbot', 'stats'],
            rowner: true,
            run: async (m, { conn }) => {
                const stats = metricsManager.getStats();
                const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                const daysOfWeekFull = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

                const now = new Date();
                const localYear = now.getFullYear();
                const localMonth = String(now.getMonth() + 1).padStart(2, '0');
                const localDay = String(now.getDate()).padStart(2, '0');
                const todayStr = `${localYear}-${localMonth}-${localDay}`;

                const targetDates = [];
                for (let i = 6; i >= 0; i--) {
                    const d = new Date(now);
                    d.setDate(now.getDate() - i);
                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const dateKey = `${yyyy}-${mm}-${dd}`;

                    targetDates.push({
                        dateStr: dateKey,
                        dayNameShort: daysOfWeek[d.getDay()],
                        dayNameFull: daysOfWeekFull[d.getDay()],
                        isToday: dateKey === todayStr
                    });
                }

                const daysData = targetDates.map(item => {
                    const realDay = (stats.days && stats.days[item.dateStr]) || {};
                    return {
                        ...item,
                        totalMessages: realDay.totalMessages || 0,
                        totalCommands: realDay.totalCommands || 0,
                        activeUsers: realDay.activeUsers ? realDay.activeUsers.length : 0,
                        activeChats: realDay.activeChats ? realDay.activeChats.length : 0,
                        errorsCount: realDay.errorsCount || 0,
                        avgResponseTimeMs: realDay.avgResponseTimeMs || 0,
                        commandsUsage: realDay.commandsUsage || {}
                    };
                });

                const values = daysData.map(d => d.totalCommands);
                const maxVal = Math.max(...values, 10) + 10;
                const currentDayData = daysData.find(d => d.isToday) || daysData[daysData.length - 1];

                const width = 900;
                const height = 400;
                const canvas = createCanvas(width, height);
                const ctx = canvas.getContext('2d');

                ctx.fillStyle = '#0a0a0c';
                ctx.fillRect(0, 0, width, height);

                ctx.fillStyle = '#121216';
                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(25, 25, width - 50, height - 50, [18]);
                    ctx.fill();
                } else {
                    ctx.fillRect(25, 25, width - 50, height - 50);
                }
                ctx.strokeStyle = '#ff4500';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#ff6b00';
                ctx.font = 'bold 28px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KATSUKI BOT - GRAFICA DE ACTIVIDAD', width / 2, 75);

                ctx.fillStyle = '#a1a1aa';
                ctx.font = '15px sans-serif';
                ctx.fillText(`Hoy es ${currentDayData.dayNameFull} (${currentDayData.dateStr}) | Registro: Sábado - Hoy`, width / 2, 105);

                const paddingLeft = 80;
                const paddingBottom = 80;
                const graphWidth = width - 160;
                const graphHeight = 180;

                ctx.strokeStyle = '#22222a';
                ctx.lineWidth = 1;
                for (let i = 0; i <= 4; i++) {
                    const y = height - paddingBottom - (graphHeight / 4) * i;
                    ctx.beginPath();
                    ctx.moveTo(paddingLeft, y);
                    ctx.lineTo(paddingLeft + graphWidth, y);
                    ctx.stroke();
                }

                const points = daysData.map((d, i) => {
                    const x = paddingLeft + (graphWidth / (daysData.length - 1)) * i;
                    const y = height - paddingBottom - (d.totalCommands / maxVal) * graphHeight;
                    return { x, y, day: d };
                });

                const gradient = ctx.createLinearGradient(0, height - paddingBottom - graphHeight, 0, height - paddingBottom);
                gradient.addColorStop(0, 'rgba(255, 69, 0, 0.45)');
                gradient.addColorStop(1, 'rgba(255, 0, 0, 0.0)');

                ctx.beginPath();
                ctx.moveTo(points[0].x, height - paddingBottom);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.lineTo(points[points.length - 1].x, height - paddingBottom);
                ctx.closePath();
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.strokeStyle = '#ff5500';
                ctx.lineWidth = 4;
                ctx.stroke();

                points.forEach((p) => {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                    ctx.fillStyle = p.day.isToday ? '#ff4500' : '#ffcc00';
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.fillStyle = p.day.isToday ? '#ff5500' : '#a1a1aa';
                    ctx.font = p.day.isToday ? 'bold 15px sans-serif' : '14px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.fillText(p.day.dayNameShort, p.x, height - paddingBottom + 25);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(p.day.totalCommands.toString(), p.x, p.y - 12);
                });

                const imageBuffer = await canvas.toBuffer('image/png');

                let txt = `📊 *ESTADÍSTICAS Y MÉTRICAS DEL BOT* 📊\n\n`;

                const daysKeys = Object.keys(stats.days || {}).sort().reverse();

                if (daysKeys.length === 0) {
                    txt += `❌ *Sin registros disponibles en la base de datos.*`;
                } else {
                    for (const dateStr of daysKeys) {
                        const dayData = stats.days[dateStr];
                        const [y, m, d] = dateStr.split('-').map(Number);
                        const dayName = daysOfWeekFull[new Date(y, m - 1, d).getDay()];

                        txt += `╭─────────────\n`;
                        txt += `│ 📅 *Fecha:* ${dateStr} (${dayName})\n`;
                        txt += `│ 💬 *Mensajes Totales:* ${dayData.totalMessages || 0}\n`;
                        txt += `│ ⚡ *Comandos Usados:* ${dayData.totalCommands || 0}\n`;
                        txt += `│ 👥 *Usuarios Activos:* ${dayData.activeUsers ? dayData.activeUsers.length : 0}\n`;
                        txt += `│ 🌐 *Chats Activos:* ${dayData.activeChats ? dayData.activeChats.length : 0}\n`;
                        txt += `│ ⚠️ *Errores:* ${dayData.errorsCount || 0}\n`;
                        txt += `│ ⏱️ *Tiempo Resp. Promedio:* ${dayData.avgResponseTimeMs || 0} ms\n`;
                        txt += `│\n│ 🏆 *Top Comandos:*\n`;

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
                }

                await conn.sendMessage(m.chat, {
                    image: imageBuffer,
                    caption: txt.trim()
                }, { quoted: m });
            }
        }
    }
};
