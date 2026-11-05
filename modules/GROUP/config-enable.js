export const enableCommand = {
    category: 'group',
    commands: {
        enable: {
            name: 'enable',
            alias: ['welcome', 'bv', 'detect', 'antisub', 'antilink', 'antilink2', 'modoadmin', 'antitoxic', 'nsfw', 'antibots', 'autoaceptar', 'autoresponder', 'autochat', 'respuestas', 'auto-responder'],
            admin: true,
            group: true,
            run: async function (m, { conn, command, args, chat }) {

                const featureMap = {
                    'welcome': 'welcome',
                    'bv': 'welcome',
                    'detect': 'detect',
                    'antisub': 'antisub',
                    'antilink': 'antiLink',
                    'antilink2': 'antiLink2',
                    'antibots': 'antiBots',
                    'antitoxic': 'antiToxic',
                    'autoaceptar': 'autoaceptar',
                    'nsfw': 'nsfw',
                    'modoadmin': 'modoadmin', 
                    'autoresponder': 'autoresponder',
                    'autochat': 'autoresponder',
                    'respuestas': 'autoresponder',
                    'auto-responder': 'autoresponder'
                };

                const type = command.toLowerCase();

                if (type === 'enable' || !featureMap[type]) {
                    let menu = `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡\n\n`;
                    const options = [
                        { name: 'Bienvenida', key: 'welcome' },
                        { name: 'Anti-Links', key: 'antiLink' },
                        { name: 'Anti-Links2', key: 'antiLink2' },
                        { name: 'Anti-Toxic', key: 'antiToxic' },
                        { name: 'Modo Admin', key: 'modoadmin' }, 
                        { name: 'Detect', key: 'detect' }, 
                        { name: 'anti-Bots', key: 'antiBots' }, 
                        { name: 'Nsfw', key: 'nsfw' }, 
                        { name: 'Auto-Responder', key: 'autoresponder' }
                    ];

                    options.forEach(opt => {
                        const status = chat[opt.key] ? '✅ ᴀᴄᴛɪᴠᴀᴅᴏ' : '❌ ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';
                        menu += `❖ *${opt.name}:* ${status}\n`;
                    });
                    return m.reply(menu.trim());
                }

                const dbKey = featureMap[type];
                let newValue;

                if (args && args.length > 0) {
                    const action = args[0].toLowerCase();
                    if (['on', '1', 'enable', 'activar'].includes(action)) {
                        newValue = true;
                    } else if (['off', '0', 'disable', 'desactivar'].includes(action)) {
                        newValue = false;
                    } else {
                        newValue = !Boolean(chat[dbKey]);
                    }
                } else {
                    newValue = !Boolean(chat[dbKey]);
                }

                await global.Chat.findOneAndUpdate(
                    { id: m.chat },
                    { $set: { [dbKey]: newValue } },
                    { upsert: true, new: true }
                );

                chat[dbKey] = newValue;
                let statusText = newValue ? 'ᴀᴄᴛɪᴠᴀᴅᴏ' : 'ᴅᴇsᴀᴄᴛɪᴠᴀᴅᴏ';

                return await global.sendNewsletterAdminInvite({
                    chat: m.chat,
                    conn: conn,
                    newsletterName: name(conn),
                    imageUrl: global.img(conn),
                    caption: `> ʟᴀ ғᴜɴᴄɪᴏɴ *${type.toUpperCase()}* sᴇ ʜᴀ ${statusText}.`,
                    expiration: true
                });
            }
        }
    }
};
