import { runReaction } from './_runReaction.js'

export const killCommand = {
    category: 'admin',
    commands: {
        superultrakill: {
            name: 'superultrakill',
            alias: ['kill', 'matar', 'superultrakill'],
            libre: false,
            admin: true,
            group: true,
            botAdmin: true,
            run: async (m, ctx) => {
                const { conn } = ctx;
                let user = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : false;
                
                if (!user) {
                    return m.reply('Por favor, menciona o responde al mensaje de la persona que deseas expulsar.');
                }

                await runReaction('kill', m, ctx);

                setTimeout(async () => {
                    try {
                        await conn.groupParticipantsUpdate(m.chat, [user], 'remove');
                    } catch (error) {
                        console.error('Error al intentar expulsar al usuario:', error);
                    }
                }, 5000);
            }
        }
    }
};
