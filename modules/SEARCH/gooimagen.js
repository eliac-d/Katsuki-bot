import { dispatchMediaTask } from '../../src/workers/workerPool.js';

export const googleImage = {
    category: 'search',
    commands: {
        gooimagen: {
            name: 'gooimagen',
            alias: ['gimage', 'gimg', 'googleimg'],
            run: async (m, { conn, text }) => {
                if (!text) return conn.reply(m.chat, `> GOOGLE IMAGES SEARCH\n\n> ✎ Ingresa un texto para iniciar la búsqueda...`, m);

                try {
                    await m.react('🕒');

                    const { json } = await dispatchMediaTask({
                        type: 'fetch_json',
                        method: 'GET',
                        url: `https://dix.lat/v1/gooimagen?q=${encodeURIComponent(text)}&apikey=${apikey}`,
                        headers: { 'Accept': 'application/json' }
                    });

                    const results = json?.data?.results || [];

                    if (!json?.success || json?.code !== 200 || !results.length) {
                        await m.react('❌');
                        return conn.reply(m.chat, `> ⍰ No se encontraron resultados para: *${text}*`, m);
                    }

                    const validUrls = results
                        .map(r => r?.url)
                        .filter(Boolean)
                        .slice(0, 4);

                    if (!validUrls.length) {
                        await m.react('❌');
                        return conn.reply(m.chat, `> ⍰ No se encontraron URLs válidas para la búsqueda.`, m);
                    }

                    const item = results[0];

                    const caption = `\t\t\t *GOOGLE IMAGES SEARCH*\n\n` +
                        `▢ *BÚSQUEDA:* ${text}\n` +
                        `▢ *TÍTULO:* ${item.title || 'Sin título'}\n` +
                        `▢ *DIMENSIONES:* ${item.width || 'N/A'}x${item.height || 'N/A'}\n` +
                        `▢ *TOTAL ENCONTRADOS:* ${json.data.total || results.length}\n` +
                        `▢ *MOSTRANDO:* ${validUrls.length}\n\n`;

                    await sendAlbum(conn, m.chat, validUrls, { caption, quoted: m });
                    await m.react('✅');

                } catch (error) {
                    await m.react('❌');
                    console.error(`[ERROR GOOGLE IMAGES]: ${error.message}`);
                    conn.reply(m.chat, `> ⚔ Error: ${error.message}`, m);
                }
            }
        }
    }
};

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
        try {
            const msg = await conn.generateWAMessage(jid, {
                image: { url },
                ...(i === 0 ? { caption: options.caption || '' } : {})
            }, { upload: conn.waUploadToServer });

            msg.message.messageContextInfo = {
                messageAssociation: { associationType: 1, parentMessageKey: album.key }
            };

            return conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
        } catch (e) {
            console.error(`[ALBUM ERROR URL]: ${url}`, e.message);
        }
    }));
}
