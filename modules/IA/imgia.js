import axios from 'axios';

async function sendAlbum(conn, jid, urls, options = {}) {
    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: urls.length,
            ...(options.quoted ? {
                contextInfo: {
                    stanzaId: options.quoted.key.id,
                    participant: options.quoted.key.participant || options.quoted.key.remoteJid,
                    quotedMessage: options.quoted.message,
                }
            } : {}),
        }
    }, {});

    await conn.relayMessage(jid, album.message, { messageId: album.key.id });

    await Promise.all(urls.map(async (url, i) => {
        const msg = await conn.generateWAMessage(jid, {
            image: { url },
            ...(i === 0 ? { caption: options.caption || '' } : {})
        }, { upload: conn.waUploadToServer });

        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };

        return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }));
}

export const aimgCommand = {
    category: 'ai',
    commands: {
        aimg: {
            name: 'aimg',
            alias: ['iaimg', 'imgg', 'genimg'],
            col: 15,
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) {
                    return conn.sendMessage(m.chat, { 
                        text: `[ ✰ ] Escribe tu *prompt* para generar imágenes.\n\n*Ejemplo:*\n> ${usedPrefix + command} Gatos cyberpunk` 
                    }, { quoted: m });
                }

                await m.react('⏳');

                try {
                   
                    const apiKeyHeader = typeof apikey !== 'undefined' ? apikey : '';

                    const { data: res } = await axios.get('https://dix.lat/v1/aimg', {
                        params: { q: text.trim() },
                        headers: {
                            'x-api-key': apiKeyHeader,
                            'Accept': 'application/json'
                        }
                    });

                    if (!res || !res.success || !res.data || !res.data.results || res.data.results.length === 0) {
                        throw new Error('No se obtuvieron resultados de la API de imágenes.');
                    }

                    const imageUrls = res.data.results;

                    await sendAlbum(conn, m.chat, imageUrls, {
                        quoted: m,
                        caption: `> *♛ Imágenes generadas con éxito para:* "${text.trim()}"`
                    });

                    await m.react('✅');

                } catch (err) {
                    console.error(err);
                    await m.react('❌');
                    await conn.sendMessage(m.chat, {
                        text: `> ⚔ ERROR: No se pudieron generar las imágenes en este momento.`
                    }, { quoted: m });
                }
            }
        }
    }
};
