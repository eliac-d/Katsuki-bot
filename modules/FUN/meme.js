import axios from 'axios';

export const memeCommand = {
    category: 'fun',
    commands: {
        meme: {
            name: 'meme',
            alias: ['memes', 'randommeme'],
            run: async (m, { conn }) => {
                await m.react("🕒");

                try {
                    let jsonRawUrl = `https://cdn.jsdelivr.net/gh/eliac-d/database@main/memes/memes.json`;
                    let response = await axios.get(jsonRawUrl);
                    let memeList = response.data;

                    if (!Array.isArray(memeList) || memeList.length === 0) {
                        await m.react("❌");
                        return conn.reply(m.chat, '> ┃ ✎ ᴇʀʀᴏʀ: ɴᴏ ʜᴀʏ ᴍᴇᴍᴇs ᴇɴ ʟᴀ ʙᴀsᴇ ᴅᴇ ᴅᴀᴛᴏs.', m);
                    }

                    let randomMemeUrl = memeList[Math.floor(Math.random() * memeList.length)];

                    await m.react("✅");
                    return conn.sendMessage(m.chat, {
                        image: { url: randomMemeUrl },
                        caption: '> ┃ ✎ ᴍᴇᴍᴇ ᴀʟᴇᴀᴛᴏʀɪᴏ'
                    }, { quoted: m });

                } catch (error) {
                    await m.react("❌");
                    return conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* Ocurrió un error al obtener el meme.\n${error.message}`, m);
                }
            }
        }
    }
};
