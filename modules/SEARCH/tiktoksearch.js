/*import { TikTok } from '@tobyg74/tiktok-api-dl';

export const tiktokCommand = {
    category: 'search',
    commands: {
        tiktoksearch: {
            name: 'tiktoksearch',
            alias: ['ttss', 'tsearch'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                if (!text) return conn.reply(m.chat, `*── 「 TIKTOK SEARCH 」 ──*\n\n*Uso:* ${usedPrefix + command} <términos>`, m);

                await m.react("🕒");

                try {
                    // Búsqueda directa en TikTok emulando peticiones de usuario real
                    const searchResult = await TikTok.Search(text, {
                        type: 'video',
                        page: 1
                    });

                    if (!searchResult || searchResult.status !== 'success' || !searchResult.result?.length) {
                        await m.react("❌");
                        return conn.reply(m.chat, `*── 「 SIN RESULTADOS 」 ──*\n\nNo se localizó contenido para "${text}".`, m);
                    }

                    const videoData = searchResult.result[0];
                    const videoUrl = videoData.url || `https://www.tiktok.com/@${videoData.author?.username}/video/${videoData.id}`;
                    
                    // Obtenemos el enlace de video sin marca de agua evitando el bloqueo de bots
                    const directVideoUrl = videoData.play || videoData.wmplay || videoData.hdplay;

                    if (!directVideoUrl) {
                        throw new Error('No se pudo obtener el enlace de reproducción directa.');
                    }

                    const fmt = (num) => new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num || 0);

                    const caption = `*── 「 TIKTOK RESULT 」 ──*\n\n` +
                                    `▢ *TÍTULO:* ${videoData.title || 'Sin descripción'}\n` +
                                    `▢ *AUTOR:* ${videoData.author?.nickname || videoData.author?.username || 'Desconocido'}\n` +
                                    `▢ *DURACIÓN:* ${videoData.duration || 0}s\n` +
                                    `▢ *MÉTRICAS:* 👁️ ${fmt(videoData.playCount)} | ❤️ ${fmt(videoData.diggCount)}\n\n` +
                                    `▢ *LINK:* ${videoUrl}`;

                    // Se envía enviando la URL para no sobrecargar la RAM del contenedor
                    await conn.sendMessage(m.chat, { 
                        video: { url: directVideoUrl }, 
                        caption: caption,
                        mimetype: 'video/mp4'
                    }, { quoted: m });

                    await m.react("✅");

                } catch (error) {
                    console.error('Error en tiktoksearch con TikTok DL:', error);
                    await m.react("❌");
                    conn.reply(m.chat, `*── 「 FAILURE 」 ──*\n\n*LOG:* Error al procesar o enviar el video completo.`, m);
                }
            }
        }
    }
};*/
