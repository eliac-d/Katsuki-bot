import fetch from "node-fetch";

export const autoResponderCommand = {
    category: 'ai',
    commands: {
        dixchat: {
            name: 'dixchat',
            alias: ['chataux'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.sendMessage(m.chat, { text: '¡Hola! Escribe un mensaje para conversar con el chat de Dix.' }, { quoted: m });

                await m.react('💬');

                
                const url = "https://dix.lat/v1/chat";

                try {
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'x-api-key': apikey
                        },
                        body: JSON.stringify({
                            message: text
                        })
                    });

                    const data = await response.json();

                    if (!response.ok || (data.status && data.status !== 'success' && !data.found)) {
                        const errorMsg = data.message || `HTTP status ${response.status}`;
                        throw new Error(errorMsg);
                    }

                    const aiResponse = data.reply || data.response || data.text;

                    if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim() === '') {
                        throw new Error("No se obtuvo una respuesta válida de la API.");
                    }

                    await m.react('✅');
                    await conn.sendPreviewMessage(m.chat, aiResponse.trim(), {
                        type: 3, 
                        ratio: 'landscape',
                        url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: 'https://cdn.dix.lat/me/msp62mtjf0e588081f42.png',
                        title: 'Dix AI Chat',
                        body: 'CATEGORÍA: Inteligencia Artificial',
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...(global.channelInfo || {}),
                            mentionedJid: [m.sender]
                        }
                    });

                } catch (e) {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, { text: `⚠️ Error: ${e.message}` }, { quoted: m });
                }
            }
        }
    }
};
