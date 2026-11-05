export const antilinkModule = {
    category: 'group',
    commands: {
        antilinkx: {
            name: 'antilink X',
            alias: ['antilinkx', 'anti-linkx', 'nolinksx'],
            admin: true,
            botAdmin: true,
            run: async (m, { args }) => {
                if (!m.isGroup) return m.reply('Este comando solo puede ser usado en grupos.');

                if (!global.db) global.db = { data: { chats: {}, users: {} } };
                if (!global.db.data) global.db.data = { chats: {}, users: {} };
                if (!global.db.data.chats) global.db.data.chats = {};
                if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {};

                const chat = global.db.data.chats[m.chat];

                if (!args[0]) {
                    const status = chat.antiLink ? 'ACTIVADO' : 'DESACTIVADO';
                    return m.reply(`*SISTEMA ANTILINK X*\n\nEstado actual: *${status}*\nUso: ${m.prefix || '.'}antilinkx on / off`);
                }

                const opt = args[0].toLowerCase();
                if (opt === 'on' || opt === '1' || opt === 'enable') {
                    chat.antiLink = true;
                    return m.reply('El sistema Antilink X ha sido activado.');
                }

                if (opt === 'off' || opt === '0' || opt === 'disable') {
                    chat.antiLink = false;
                    return m.reply('El sistema Antilink X ha sido desactivado.');
                }

                return m.reply(`Opción inválida. Usa *${m.prefix || '.'}antilinkx on* o *${m.prefix || '.'}antilinkx off*`);
            }
        }
    },
    before: async (m, { conn, isBotAdmin }) => {
        if (!m.isGroup || m.fromMe) return;

        if (!global.db?.data?.chats?.[m.chat]?.antiLink) return;

        const rawText = m.text || m.body || m.caption || m.message?.conversation || m.message?.extendedTextMessage?.text || '';
        if (!rawText) return;

        const allowedDomains = [
            'youtube.com', 'youtu.be',
            'tiktok.com',
            'instagram.com',
            'facebook.com', 'fb.watch', 'fb.me'
        ];

        const isAllowed = allowedDomains.some(domain => rawText.toLowerCase().includes(domain));
        if (isAllowed) return;

        const linkPatterns = [
            /chat\.whatsapp\.com\/[a-zA-Z0-9]/i,
            /whatsapp\.com\/channel\/[a-zA-Z0-9]/i,
            /t\.me\/[a-zA-Z0-9]/i,
            /telegram\.me\/[a-zA-Z0-9]/i,
            /discord\.gg\/[a-zA-Z0-9]/i,
            /discord\.com\/invite\/[a-zA-Z0-9]/i,
            /x\.com\/[a-zA-Z0-9]/i,
            /twitter\.com\/[a-zA-Z0-9]/i,
            /twitch\.tv\/[a-zA-Z0-9]/i,
            /reddit\.com\/r\/[a-zA-Z0-9]/i,
            /pinterest\.com\/[a-zA-Z0-9]/i,
            /linkedin\.com\/in\/[a-zA-Z0-9]/i,
            /snapchat\.com\/add\/[a-zA-Z0-9]/i,
            /mediafire\.com\/[a-zA-Z0-9]/i,
            /mega\.nz\/[a-zA-Z0-9]/i,
            /drive\.google\.com\/[a-zA-Z0-9]/i,
            /dropbox\.com\/[a-zA-Z0-9]/i,
            /onlyfans\.com\/[a-zA-Z0-9]/i,
            /patreon\.com\/[a-zA-Z0-9]/i,
            /http:\/\//i,
            /https:\/\//i,
            /www\.[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i
        ];

        const hasForbiddenLink = linkPatterns.some(pattern => pattern.test(rawText));

        if (hasForbiddenLink) {
            if (m.isBaileys) return;

            if (isBotAdmin) {
                try {
                    await conn.sendMessage(m.chat, { delete: m.key });
                } catch (err) {
                    console.error("Error al borrar mensaje de enlace:", err);
                }
            }

            if (!global.db.data.users) global.db.data.users = {};
            if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = { warn: 0 };
            const user = global.db.data.users[m.sender];

            user.warn = (user.warn || 0) + 1;

            if (user.warn >= 3) {
                user.warn = 0;
                await conn.sendMessage(m.chat, {
                    text: `*ADVERTENCIA MÁXIMA (ANTILINK X)*\n\n@${m.sender.split('@')[0]} ha alcanzado 3 advertencias por envío de enlaces prohibidos y será eliminado del grupo.`,
                    mentions: [m.sender]
                });

                if (isBotAdmin) {
                    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                }
            } else {
                await conn.sendMessage(m.chat, {
                    text: `*ANTILINK X - ENLACE PROHIBIDO*\n\n@${m.sender.split('@')[0]} no está permitido enviar este tipo de enlaces en este grupo.\nTu mensaje ha sido eliminado.\n\n*Advertencias:* ${user.warn}/3`,
                    mentions: [m.sender]
                });
            }
        }
    }
};
