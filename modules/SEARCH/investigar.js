import fetch from 'node-fetch';

export const downloadsModule = {
    category: 'tools',
    commands: {
        investigar: {
            name: 'investigar',
            alias: ['investigacion', 'inv', 'ai', 'research'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) {
                    return conn.reply(m.chat, `*Uso:* ${usedPrefix + command} <tema o consulta a investigar>`, m);
                }

                const queryParam = text.trim();
                const apiKey = global.apikey || '';

                
                try {
                    const apiUrl = `https://dix.lat/v1/investigar?q=${encodeURIComponent(queryParam)}&apikey=${encodeURIComponent(apiKey)}`;

                    const response = await fetch(apiUrl, {
                        headers: {
                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                            'Accept': 'application/json'
                        },
                        timeout: 20000
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                    }

                    const json = await response.json();

                    if (!json.success || !json.data) {
                        return conn.reply(m.chat, `⚠️ No se pudo obtener información para la investigación: "${queryParam}"`, m);
                    }

                    const { answer, sources } = json.data;

                    let outputMessage = `🔍 *RESULTADO DE LA INVESTIGACIÓN*\n\n`;
                    outputMessage += `📌 *Consulta:* ${queryParam}\n\n`;
                    outputMessage += `💡 *Respuesta:*\n${answer || 'Sin respuesta disponible.'}\n\n`;

                    if (Array.isArray(sources) && sources.length > 0) {
                        outputMessage += `📚 *FUENTES CONSULTADAS* (${sources.length}):\n`;
                        sources.forEach((source, index) => {
                            const title = source.title || 'Fuente sin título';
                            const url = source.url || '';
                            outputMessage += `${index + 1}. *${title}*\n🔗 ${url}\n`;
                        });
                    }

                    await inapp({chat: m.chat, conn: conn, text: outputMessage.trim(), title: name(conn)});

                } catch (error) {
                    console.error('Error en comando investigar:', error);

                    let safeError = error.message || 'Error desconocido';

                    if (global.key) {
                        safeError = safeError.replace(new RegExp(global.key, 'g'), '***HIDDEN_KEY***');
                    }
                    if (global.dixKey) {
                        safeError = safeError.replace(new RegExp(global.dixKey, 'g'), '***HIDDEN_KEY***');
                    }
                    safeError = safeError.replace(/https?:\/\/[^\s]+/g, '[URL]');

                    await conn.reply(m.chat, `❌ Error al realizar la investigación:\n\n${safeError}`, m);
                }
            }
        }
    }
};
