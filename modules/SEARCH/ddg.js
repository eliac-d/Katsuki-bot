import fetch from 'node-fetch';

export const downloadsModule = {
    category: 'search',
    commands: {
        google: {
            name: 'duckduckgo',
            alias: ['ddg', 'search', 'buscar'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) {
                    return conn.reply(m.chat, `*Uso:* ${usedPrefix + command} <consulta de búsqueda>`, m);
                }

                const queryParam = text.trim();
                await conn.reply(m.chat, `🔍 Realizando búsqueda para: "${queryParam}"...\nEspere un momento.`, m);

                try {
                    const apiUrl = `https://dix.lat/v1/duckduckgo?q=${encodeURIComponent(queryParam)}`;

                    const response = await fetch(apiUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        timeout: 15000
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                    }

                    const json = await response.json();

                    if (!json.success || !json.data || !Array.isArray(json.data.results) || json.data.results.length === 0) {
                        return conn.reply(m.chat, `⚠️ No se encontraron resultados de búsqueda para: "${queryParam}"`, m);
                    }

                    const results = json.data.results;
                    let outputMessage = `🎯 *RESULTADOS DE BÚSQUEDA* (${results.length}):\n\n`;

                    results.forEach((item, index) => {
                        const cleanTitle = item.title ? item.title.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Sin título';
                        const cleanSnippet = item.snippet ? item.snippet.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Sin descripción';
                        
                        outputMessage += `*${index + 1}. ${cleanTitle}*\n`;
                        outputMessage += `📝 ${cleanSnippet}\n`;
                        outputMessage += `🔗 ${item.link}\n\n`;
                    });

                    await conn.reply(m.chat, outputMessage.trim(), m);

                } catch (error) {
                    console.error('Error en comando google:', error);

                    let safeError = error.message || 'Error desconocido';

                    if (global.key) {
                        safeError = safeError.replace(new RegExp(global.key, 'g'), '***HIDDEN_KEY***');
                    }
                    safeError = safeError.replace(/https?:\/\/[^\s]+/g, '[URL]');

                    await conn.reply(m.chat, `❌ Error al realizar la búsqueda:\n\n${safeError}`, m);
                }
            }
        }
    }
};
