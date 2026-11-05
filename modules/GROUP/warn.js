export const warnModule = {
    category: 'group',
    commands: {
        warn: {
            name: 'warn',
            alias: ['advertir', 'advertencia'],
            desc: 'Añade una advertencia a un usuario. Al llegar a 3 es eliminado del grupo.',
            admin: true,
            botAdmin: true,
            run: async (m, { conn, args, isBotAdmin }) => {
                if (!m.isGroup) return m.reply('Este comando solo puede ser usado en grupos.');

                let who;
                if (m.quoted) {
                    who = m.quoted.sender;
                } else if (m.mentionedJid && m.mentionedJid[0]) {
                    who = m.mentionedJid[0];
                } else if (args[0] && args[0].replace(/[^0-9]/g, '')) {
                    who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                if (!who) {
                    return m.reply('Uso incorrecto.\nMenciona a un usuario, responde a su mensaje o escribe su número.\nEjemplo: .warn @usuario [razón]');
                }

                const reason = args.slice(1).join(' ').trim() || 'Sin razón especificada';

                if (!global.db) global.db = { data: { users: {} } };
                if (!global.db.data) global.db.data = { users: {} };
                if (!global.db.data.users) global.db.data.users = {};
                if (!global.db.data.users[who]) global.db.data.users[who] = { warn: 0 };

                const user = global.db.data.users[who];
                user.warn = (user.warn || 0) + 1;

                if (user.warn >= 3) {
                    user.warn = 0;
                    await conn.sendMessage(m.chat, {
                        text: `*ADVERTENCIA MÁXIMA*\n\n@${who.split('@')[0]} ha alcanzado 3 advertencias.\nRazón final: ${reason}\n\nSerá eliminado del grupo.`,
                        mentions: [who]
                    });

                    if (isBotAdmin) {
                        await conn.groupParticipantsUpdate(m.chat, [who], 'remove');
                    }
                } else {
                    await conn.sendMessage(m.chat, {
                        text: `*ADVERTENCIA ASIGNADA*\n\n*Usuario:* @${who.split('@')[0]}\n*Razón:* ${reason}\n*Advertencias actuales:* ${user.warn}/3`,
                        mentions: [who]
                    });
                }
            }
        },
        unwarn: {
            name: 'unwarn',
            alias: ['delwarn', 'quitaradvertencia'],
            desc: 'Restaura o quita una advertencia a un usuario.',
            admin: true,
            run: async (m, { conn, args }) => {
                if (!m.isGroup) return m.reply('Este comando solo puede ser usado en grupos.');

                let who;
                if (m.quoted) {
                    who = m.quoted.sender;
                } else if (m.mentionedJid && m.mentionedJid[0]) {
                    who = m.mentionedJid[0];
                } else if (args[0] && args[0].replace(/[^0-9]/g, '')) {
                    who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                if (!who) {
                    return m.reply('Uso incorrecto.\nMenciona a un usuario o responde a su mensaje.\nEjemplo: .unwarn @usuario');
                }

                if (!global.db?.data?.users?.[who]) {
                    return m.reply('El usuario no tiene advertencias registradas.');
                }

                const user = global.db.data.users[who];
                if (!user.warn || user.warn <= 0) {
                    user.warn = 0;
                    return m.reply('El usuario ya tiene 0 advertencias.');
                }

                user.warn -= 1;

                return conn.sendMessage(m.chat, {
                    text: `*ADVERTENCIA REMOVIDA*\n\n*Usuario:* @${who.split('@')[0]}\n*Advertencias actuales:* ${user.warn}/3`,
                    mentions: [who]
                });
            }
        },
        warns: {
            name: 'warns',
            alias: ['advertencias', 'mywarns'],
            desc: 'Muestra las advertencias acumuladas de un usuario.',
            run: async (m, { conn, args }) => {
                let who = m.sender;
                if (m.quoted) {
                    who = m.quoted.sender;
                } else if (m.mentionedJid && m.mentionedJid[0]) {
                    who = m.mentionedJid[0];
                } else if (args[0] && args[0].replace(/[^0-9]/g, '')) {
                    who = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                }

                const warnCount = global.db?.data?.users?.[who]?.warn || 0;

                return conn.sendMessage(m.chat, {
                    text: `*ESTADO DE ADVERTENCIAS*\n\n*Usuario:* @${who.split('@')[0]}\n*Advertencias:* ${warnCount}/3`,
                    mentions: [who]
                });
            }
        }
    }
};
