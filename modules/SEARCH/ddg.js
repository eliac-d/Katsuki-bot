import fetch from 'node-fetch';

const MAX_ALBUM = 10;

function decodeHtmlEntities(str) {
    if (!str) return '';
    return str
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .trim();
}

function decodeBingUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.replace(/&amp;/g, '&');
    if (url.includes('bing.com/ck/a')) {
        const match = url.match(/[?&]u=a1([^&]+)/);
        if (match) {
            try {
                const b64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
                const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
                const decoded = Buffer.from(padded, 'base64').toString('utf-8');
                if (/^https?:\/\//.test(decoded)) return decoded;
            } catch (e) {}
        }
    }
    return url;
}

function cleanUrl(rawUrl) {
    if (!rawUrl) return '';
    let url = rawUrl.replace(/&amp;/g, '&');
    if (url.includes('uddg=')) {
        try { url = decodeURIComponent(url.split('uddg=')[1].split('&')[0]); } catch (e) {}
    } else if (url.startsWith('//')) {
        url = 'https:' + url;
    }
    return decodeBingUrl(url);
}

async function fetchJson(url, timeout = 15000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            },
            signal: controller.signal
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
        return await res.json();
    } catch (e) {
        clearTimeout(timer);
        throw e;
    }
}

async function sendAlbum(conn, jid, urls, options = {}) {
    if (!urls.length) return;

    const generated = await Promise.all(urls.map((url, i) =>
        conn.generateWAMessage(jid, {
            image: { url },
            ...(i === 0 ? { caption: options.caption || '' } : {})
        }, { upload: conn.waUploadToServer }).catch(() => null)
    ));

    const valid = generated.filter(Boolean);
    if (!valid.length) throw new Error('No se pudo preparar ninguna imagen');

    const album = conn.generateWAMessageFromContent(jid, {
        albumMessage: {
            expectedImageCount: valid.length,
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

    for (const msg of valid) {
        msg.message.messageContextInfo = {
            messageAssociation: { associationType: 1, parentMessageKey: album.key }
        };
    }

    for (const msg of valid) {
        await conn.relayMessage(jid, msg.message, { messageId: msg.key.id });
    }
}

async function searchWeb(m, conn, query) {
    const url = `https://dix.lat/v1/duckduckgo?q=${encodeURIComponent(query)}&type=web`;
    const json = await fetchJson(url);

    const results = json?.data?.results;
    if (!json?.success || !Array.isArray(results) || !results.length) {
        await m.react('❌');
        return conn.reply(m.chat, `⚠️ No se encontraron resultados para: "${query}"`, m);
    }

    const limited = results.slice(0, 8);
    let output = `🎯 *RESULTADOS DE BÚSQUEDA*\n📌 Consulta: *${query}*\n📊 Total: ${json.data.totalResults}\n\n`;

    limited.forEach((item, i) => {
        const title = decodeHtmlEntities(item.title) || 'Sin título';
        const snippetRaw = decodeHtmlEntities(item.snippet) || 'Sin descripción';
        const snippet = snippetRaw.length > 160 ? snippetRaw.slice(0, 160) + '…' : snippetRaw;
        const link = cleanUrl(item.link);
        output += `*${i + 1}. ${title}*\n📝 ${snippet}\n🔗 ${link}\n\n`;
    });

    await conn.reply(m.chat, output.trim(), m);
    await m.react('✅');
}

async function searchImages(m, conn, query) {
    const url = `https://dix.lat/v1/duckduckgo?q=${encodeURIComponent(query)}&type=images`;
    const json = await fetchJson(url);

    const rawResults = json?.data?.results;
    if (!json?.success || !Array.isArray(rawResults) || !rawResults.length) {
        await m.react('❌');
        return conn.reply(m.chat, `⚠️ No se encontraron imágenes para: "${query}"`, m);
    }

    const images = rawResults
        .map(r => ({
            url: Array.isArray(r.media) ? r.media[0] : null,
            title: decodeHtmlEntities(r.title) || '',
            link: cleanUrl(r.link) || ''
        }))
        .filter(img => img.url && /^https?:\/\//.test(img.url))
        .slice(0, MAX_ALBUM);

    if (!images.length) {
        await m.react('❌');
        return conn.reply(m.chat, `⚠️ Los resultados no contienen imágenes válidas.`, m);
    }

    const caption =
        `\t\t\t *DUCKDUCKGO IMAGES*\n\n` +
        `▢ *BÚSQUEDA:* ${query}\n` +
        `▢ *RESULTADOS:* ${json.data.totalResults}\n` +
        `▢ *ENVIADAS:* ${images.length}\n`;

    try {
        await sendAlbum(conn, m.chat, images.map(i => i.url), { caption, quoted: m });
        await m.react('✅');
    } catch (albumError) {
        console.warn('[DDG-IMAGES] Álbum falló, usando envío individual:', albumError.message);
        for (let i = 0; i < images.length; i++) {
            try {
                await conn.sendMessage(m.chat, {
                    image: { url: images[i].url },
                    caption: i === 0 ? caption : ''
                }, { quoted: m });
            } catch (e) {}
        }
        await m.react('✅');
    }
}

export const downloadsModule = {
    category: 'search',
    commands: {
        duckduckgo: {
            name: 'duckduckgo',
            alias: ['ddg', 'search', 'buscar'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) {
                    return conn.reply(m.chat,
                        `*Uso:*\n` +
                        `• ${usedPrefix + command} <consulta>        — Búsqueda web\n` +
                        `• ${usedPrefix + command} img <consulta>    — Búsqueda de imágenes`,
                        m);
                }

                let query = text.trim();
                let mode = 'web';

                if (/^images?\s+/i.test(query)) {
                    mode = 'images';
                    query = query.replace(/^images?\s+/i, '').trim();
                }

                if (!query) {
                    return conn.reply(m.chat, `⚠️ Debes especificar un término de búsqueda.`, m);
                }

                await m.react('🔍');

                try {
                    if (mode === 'images') {
                        await searchImages(m, conn, query);
                    } else {
                        await searchWeb(m, conn, query);
                    }
                } catch (error) {
                    await m.react('❌');
                    let safeError = (error.message || 'Error desconocido')
                        .replace(/https?:\/\/[^\s]+/g, '[URL]');
                    if (global.key) {
                        safeError = safeError.replace(new RegExp(global.key, 'g'), '***HIDDEN_KEY***');
                    }
                    await conn.reply(m.chat, `❌ Error al realizar la búsqueda:\n\n${safeError}`, m);
                }
            }
        }
    }
};