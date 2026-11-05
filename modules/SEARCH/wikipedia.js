export const wikipediaCommand = {
    category: 'search',
    commands: {
        wikipedia: {
            name: 'wikipedia',
            alias: ['wiki', 'wikisearch'],
            run: async (m, { conn, text, command }) => {
                if (!text) return m.reply(`❯❯ 𝗨𝗦𝗢 𝗜𝗡𝗖𝗢𝗥𝗥𝗘𝗖𝗧𝗢\n\n指令: .${command} [término]`);

                m.react('🔍');

                try {
                    const response = await fetch(`https://dix.lat/v1/wikipedia?q=${encodeURIComponent(text)}`);
                    const json = await response.json();

                    if (!json.success || !json.data || !json.data.answer) {
                        m.react('❌');
                        return m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: No se detectaron resultados para "${text}".`);
                    }

                    const { title, answer, sources } = json.data;
                    const sourceUrl = sources && sources.length > 0 ? sources[0].url : 'https://es.wikipedia.org';

                    let mensaje = `❯❯ 𝗪𝗜𝗞𝗜𝗣𝗘𝗗𝗜𝗔 𝗦𝗘𝗔𝗥𝗖𝗛 𝗥𝗘𝗦𝗨𝗟𝗧𝗦\n\n` +
                                  `❖ 𝗧𝗜𝗧𝗨𝗟𝗢: ${title}\n` +
                                  `❖ 𝗙𝗨𝗘𝗡𝗧𝗘: ${sourceUrl}\n\n` +
                                  `❖ 𝗥𝗘𝗦𝗨𝗠𝗘𝗡:\n${answer.trim()}`;

                    await conn.sendMessage(m.chat, {
                        product: {
                            productImage: {
                                url: "https://cdn.dix.lat/me/mhy8_20260910-c91x-3yk1-569c.png"
                            },
                            title: "WIKIPEDIA SEARCH",
                            description: `Información sobre: ${title}`,
                            retailerId: "1466",
                            productId: "37199733896340479",
                            productImageCount: 1,
                        },
                        businessOwnerJid: "50432955554@s.whatsapp.net",
                        footer: mensaje
                    }, { messageType: 'product', quoted: m });

                    m.react('✅');

                } catch (e) {
                    console.error(e);
                    m.react('❌');
                    m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Ocurrió un problema al consultar Wikipedia.');
                }
            }
        }
    }
};
