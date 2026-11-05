import fetch from 'node-fetch';

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';

function formatToWhatsApp(text) {
    if (!text) return '';
    return text
        .replace(/^#{1,6}\s+(.+)$/gm, '*$1*')
        .replace(/\*\*(.*?)\*\*/g, '*$1*')
        .replace(/^\s*[\-\*]\s+/gm, '• ');
}

export const chatgptCommand = {
    category: 'ai',
    commands: {
        chatgpt: {
            name: 'gemini',
            alias: ['ia'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                const prompt = text || (m.quoted ? m.quoted.text : '');

                if (!prompt?.trim()) {
                    return await conn.sendMessage(m.chat, { 
                        text: `> ⌗ Hola, ¿En qué puedo ayudarte hoy?\n\n*Uso:* ${usedPrefix + command} <tu pregunta>` 
                    }, { quoted: m });
                }

                await m.react('⏳');

                try {
                    const payload = {
                        prompt: prompt,
                        userId: m.sender,
                        chatId: m.chat
                    };

                    const response = await fetch("https://dix.lat/v1/gemini", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "x-api-key": apikey || 'dix_free',
                            "User-Agent": UA
                        },
                        body: JSON.stringify(payload)
                    });

                    const json = await response.json();

                    let respuestaRaw = null;
                    if (json?.data?.response) {
                        respuestaRaw = json.data.response;
                    } else if (json?.message) {
                        throw new Error(json.message);
                    } else {
                        throw new Error("Respuesta inválida de la API Dix");
                    }

                    const mensajeFormateado = formatToWhatsApp(respuestaRaw);
                    const thumbnail = 'https://cdn.dix.lat/me/540c616d-4648-4f54-99ab-10fe38e54b1b.png';
                    const channelInfo = global.channelInfo || {};

                    await m.react('✅');

                    await conn.sendPreviewMessage(m.chat, mensajeFormateado, {
                        type: 3, 
                        ratio: 'landscape',
                        url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: thumbnail,
                        title: 'Gemini AI Network',
                        body: 'CATEGORÍA: Inteligencia Artificial',
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo,
                            mentionedJid: [m.sender]
                        }
                    });

                } catch (e) {
                    await m.react('❌');
                    await conn.sendMessage(m.chat, { 
                        text: `> ⚔ ERROR: No se pudo procesar la solicitud en este momento.\n\n${e.message}` 
                    }, { quoted: m });
                }
            }
        }
    }
};
