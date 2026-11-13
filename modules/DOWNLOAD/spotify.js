import fetch from 'node-fetch';

export const spotifyDownloadModule = {
    category: 'descargas',
    commands: {
        spotify: {
            name: 'spotify',
            alias: ['spt', 'sp', 'music'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) return m.reply(`> ✎ USO: ${usedPrefix + command} <nombre de la canción o URL>`);

                await m.react('🕓');

                const API_KEY = apikey;
                const SEARCH_URL = 'https://dix.lat/v1/s/spotify';
                const DOWNLOAD_URL = 'https://dix.lat/v1/d/spotify';

                try {
                    const isUrl = text.match(/^(https?:\/\/)?(www\.)?(open\.spotify\.com|spotify\.link)\/.+$/gi);
                    let trackUrl = '';
                    let trackInfo = {};

                    if (isUrl) {
                        trackUrl = text;
                        trackInfo = { title: 'Spotify Track', artist: 'Desconocido', album: '-', duration: '-', year: '-' };
                    } else {
                        const searchRes = await fetch(`${SEARCH_URL}?q=${encodeURIComponent(text)}&limit=1`);
                        const searchData = await searchRes.json();

                        if (!searchData.success || !searchData.data || !searchData.data.results || searchData.data.results.length === 0) {
                            await m.react('✖️');
                            return m.reply('> ⚔ ERROR: No se encontraron resultados.');
                        }

                        const result = searchData.data.results[0];
                        trackUrl = result.link;
                        trackInfo = {
                            title: result.title,
                            artist: result.artist,
                            album: result.album,
                            duration: result.duration,
                            year: result.year || 'Desconocido',
                            image: result.image
                        };

                        let txt = `♫ SPOTIFY DOWNLOAD 𝄞\n\n`;
                        txt += `✰ TÍTULO: ${trackInfo.title}\n`;
                        txt += `♛ ARTISTA: ${trackInfo.artist}\n`;
                        txt += `✎ ÁLBUM: ${trackInfo.album}\n`;
                        txt += `⌬ DURACIÓN: ${trackInfo.duration}\n`;
                        txt += `◈ PUBLICADO: ${trackInfo.year}\n\n`;
                        txt += `⌗ Procesando audio, espere un momento...`;

                        if (trackInfo.image) {
                            await conn.sendMessage(m.chat, { 
                                image: { url: trackInfo.image }, 
                                caption: txt 
                            }, { quoted: m });
                        } else {
                            await m.reply(txt);
                        }
                    }

                    const downloadRes = await fetch(`${DOWNLOAD_URL}?apikey=${API_KEY}&url=${encodeURIComponent(trackUrl)}`);
                    const downloadData = await downloadRes.json();

                    if (downloadData.success && downloadData.data && downloadData.data.downloadURL) {
                        await conn.sendMessage(m.chat, { 
                            audio: { url: downloadData.data.downloadURL }, 
                            mimetype: 'audio/mpeg', 
                            fileName: `${downloadData.data.title || trackInfo.title}.mp3` 
                        }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('✖️');
                        m.reply('> ⚔ ERROR: No se pudo generar el enlace de descarga.');
                    }

                } catch (e) {
                    await m.react('✖️');
                    m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
                }
            }
        }
    }
};