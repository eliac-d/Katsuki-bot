export const setBotProfileCommand = {
    category: 'owner',
    commands: {
        setbotpp: {
            name: 'setbotpp',
            alias: ['setpfp', 'setbotfoto'],
            rowner: true,
            run: async (m, { conn }) => {
                let q = m.quoted ? m.quoted : m;
                let mime = (q.msg || q).mimetype || '';

                if (!/image/.test(mime)) {
                    return conn.reply(m.chat, '> ┃ ✎ ᴇʀʀᴏʀ: ʀᴇsᴘᴏɴᴅᴇ ᴀ ᴜɴᴀ ɪᴍᴀɢᴇɴ.', m);
                }

                await m.react("🕒");

                try {
                    let media = await q.download();
                    let botJid = conn.user.jid || conn.user.id;
                    
                    await conn.updateProfilePicture(botJid, media);
                    await m.react("✅");

                    return conn.reply(m.chat, `> ┏━━━〔 sɪsᴛᴇᴍᴀ 〕━━━┓\n> ┃ ✎ ᴄ...ɴғɪɢ: ғᴏᴛᴏ ᴀᴄᴛᴜᴀʟɪᴢᴀᴅᴀ\n> ┗━━━━━━━━━━━━━━━━━━┛`, m);
                } catch (error) {
                    await m.react("❌");
                    return conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* No se pudo actualizar la foto de perfil del bot.`, m);
                }
            }
        }
    }
};
