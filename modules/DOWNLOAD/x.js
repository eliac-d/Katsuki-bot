export const twitterDownloadModule = {
    category: 'descargas',
    commands: {
        xdl: {
            name: 'x',
            alias: ['twitter', 'xdl'],
            run: async (m, { conn, text }) => {
                const url = (text || '').trim();
                if (!url) {
                    return m.reply(`*⍰ Ingresa un enlace de X.*\n> Ejemplo: *.x https://x.com/usuario/status/1234567890*`);
                }

                const match = url.match(/(?:x|twitter)\.com\/[^/]+\/status\/(\d+)/i);
                if (!match) {
                    return m.reply(`*ஐ Enlace de X no válido.*`);
                }

                const tweetId = match[1];

                try {
                    if (m.react) await m.react("⏳");

                    const token = ((Number(tweetId) / 1e15) * Math.PI)
                        .toString(36)
                        .replace(/(0+|\.)/g, '');

                    const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}&lang=en`;
                    const res = await fetch(apiUrl, {
                        headers: { 'User-Agent': 'Mozilla/5.0' }
                    });

                    if (!res.ok) throw new Error(`La API de X respondió ${res.status}`);
                    const data = await res.json();

                    if (data.__typename === 'TweetTombstone') {
                        if (m.react) await m.react("❌");
                        return m.reply(`*ஐ Este tuit está restringido.*\n> Contenido sensible o requiere iniciar sesión.`);
                    }

                    const media = data.mediaDetails?.[0];
                    if (!media || media.type !== 'video') {
                        if (m.react) await m.react("❌");
                        return m.reply(`*ஐ El tuit no contiene un video descargable.*`);
                    }

                    const variants = media.video_info?.variants || [];
                    const mp4s = variants
                        .filter(v => v.content_type === 'video/mp4')
                        .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));

                    if (!mp4s.length) {
                        if (m.react) await m.react("❌");
                        return m.reply(`*ஐ No se encontró una variante MP4.*`);
                    }

                    const best = mp4s[0];
                    const videoUrl = best.url;

                    const authorName = data.user?.name || 'Desconocido';
                    const authorHandle = data.user?.screen_name ? `@${data.user.screen_name}` : '';
                    const tweetText = (data.text || 'Sin texto').slice(0, 200).replace(/\n/g, ' ');
                    const durationMs = media.video_info?.duration_millis;
                    const durationStr = durationMs
                        ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
                        : 'Desconocida';
                    const aspect = media.video_info?.aspect_ratio;
                    const resolutionHint = aspect ? `${aspect[0]}x${aspect[1]}` : 'No disponible';
                    const bitrateStr = best.bitrate ? `${Math.round(best.bitrate / 1000)} kbps` : 'No disponible';

                    const videoRes = await fetch(videoUrl, {
                        headers: { 'user-agent': 'Mozilla/5.0' }
                    });

                    if (!videoRes.ok) throw new Error(`No se pudo descargar el video (${videoRes.status})`);

                    const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
                    const sizeMB = videoBuffer.length / (1024 * 1024);
                    const sizeStr = `${sizeMB.toFixed(2)} MB`;

                    const caption = `\t\t\t 𝗫 𝗗𝗢𝗪𝗡𝗟𝗢𝗔𝗗𝗘𝗥\n\n> ღ *Autor:* ${authorName} ${authorHandle}\n> ✰ *Texto:* ${tweetText}\n> ⍰ *Duración:* ${durationStr}\n> ஐ *Resolución:* ${resolutionHint}\n> ✎ *Bitrate:* ${bitrateStr}\n> ❖ *Tamaño:* ${sizeStr}\n> ♡ *Enlace:* ${url}\n\n`;

                    if (sizeMB > 80) {
                        await conn.sendMessage(m.chat, {
                            document: videoBuffer,
                            caption: caption,
                            fileName: `x_video_${tweetId}.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    } else {
                        await conn.sendMessage(m.chat, {
                            video: videoBuffer,
                            caption: caption,
                            fileName: `x_video_${tweetId}.mp4`,
                            mimetype: 'video/mp4'
                        }, { quoted: m });
                    }

                    if (m.react) await m.react("✅");

                } catch (e) {
                    console.error('[X Downloader]', e);
                    if (m.react) await m.react("❌");
                    await m.reply(`*卍 Error al procesar el video de X.*\n> El enlace puede haber expirado, el video ser privado o la API no respondió.\n> Detalle: ${e.message || e}`);
                }
            }
        }
    }
};