import yts from 'yt-search';
import * as pix from 'pixcore';
import axios from 'axios';
import fetch from 'node-fetch';
import { dispatchMediaTask } from '../../src/workers/workerPool.js';

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const API_KEY = apikey;

async function getOptimizedThumbnail(url) {
    if (!url) return Buffer.alloc(0);
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
    const arrayBuffer = await res.arrayBuffer();
    const inputBuffer = Buffer.from(arrayBuffer);

    const resizedBuffer = await (await pix.read(inputBuffer))
        .resize(300, 220, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();

    return resizedBuffer;
}

async function axiosWithRetry(url, options = {}, retries = 3, delay = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            return await axios.get(url, options);
        } catch (error) {
            const status = error?.response?.status;
            if ((status === 429 || status === 403 || status >= 500) && i < retries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
                continue;
            }
            throw error;
        }
    }
}

async function descargarMusicaDix(videoUrl) {
    const apiUrl = `https://dix.lat/v1/ytdl?url=${encodeURIComponent(videoUrl)}&type=mp3&apikey=${API_KEY}`;
    const response = await axiosWithRetry(apiUrl, { headers: { 'User-Agent': UA } });
    const data = response.data;

    if (data && data.success && data.data && data.data.downloadURL) {
        return {
            title: data.data.title || 'Sin título',
            downloadURL: data.data.downloadURL
        };
    } else {
        throw new Error('No se encontró el enlace de descarga en la respuesta de la API Dix.');
    }
}

export const downloadsModule = {
    category: 'descargas',
    commands: {
        youtube_audio: {
            name: 'play',
            alias: ['audio', 'mp3', 'playaudio'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                if (!text?.trim()) return conn.reply(m.chat, `*Uso:* ${usedPrefix + command} <búsqueda o enlace>`, m);

                const isDocument = /mp3$/i.test(command);

                try {
                    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|shorts\/|live\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})/;
                    const videoMatch = text.trim().match(youtubeRegex);

                    let searchResults = null;

                    try {
                        if (videoMatch && videoMatch[1]) {
                            const cleanUrl = `https://www.youtube.com/watch?v=${videoMatch[1]}`;
                            searchResults = await yts(cleanUrl);
                        } else {
                            searchResults = await yts(text);
                        }
                    } catch (ytsErr) {
                        return conn.reply(m.chat, 'Error de conexión con el servicio de búsqueda de YouTube. Intenta de nuevo.', m);
                    }

                    const videoSearchResult = searchResults?.videos?.[0];

                    if (!videoSearchResult) return conn.reply(m.chat, 'No se encontraron resultados de YouTube.', m);

                    const maxDurationSeconds = 600;
                    if (videoSearchResult.seconds && videoSearchResult.seconds > maxDurationSeconds) {
                        const videoId = videoSearchResult.videoId;
                        const directUrl = `https://y2mate.gs/#${videoId}/mp3`;
                        const h = `El archivo que intentas descargar excede el tiempo permitido en este sistema de automatización.\n\n` +
                            `TITULO: ${videoSearchResult.title || 'No disponible'}\n` +
                            `DURACION: ${videoSearchResult.timestamp || videoSearchResult.seconds + ' segundos'}\n` +
                            `LIMITE PERMITIDO: 10 minutos\n\n` +
                            `Si deseas descargar este contenido multimedia, puedes acceder directamente a nuestra página web y descargarlo ahí:\n` +
                            `${directUrl}`;

                        await global.inapp({
                            chat: m.chat,
                            conn: conn,
                            title: global.name(conn),
                            text: h,
                            quoted: m
                        });
                        return;
                    }

                    const videoId = videoSearchResult.videoId;
                    const videoUrl = 'https://www.youtube.com/watch?v=' + videoId;
                    const thumbUrl = videoSearchResult.image || videoSearchResult.thumbnail;

                    let thumbnailBuffer;
                    try {
                        thumbnailBuffer = await getOptimizedThumbnail(thumbUrl);
                    } catch (e) {
                        thumbnailBuffer = Buffer.alloc(0);
                    }

                    const infoMessage = `TÍTULO: ${videoSearchResult.title || 'No disponible'}\n` +
                        `CANAL: ${videoSearchResult.author?.name || 'No disponible'}\n` +
                        `DURACIÓN: ${videoSearchResult.timestamp || videoSearchResult.duration?.toString() || 'No disponible'}\n` +
                        `VISTAS: ${videoSearchResult.views?.toLocaleString() || 'No disponible'}\n` +
                        `FECHA: ${videoSearchResult.ago || 'No disponible'}\n` +
                        `${videoUrl}\n\n✦ *Descargado mediante Y2Mate.gs*`;

                    await conn.sendPreviewMessage(m.chat, infoMessage, {
                        type: 1,
                        ratio: 'landscape',
                        url: videoUrl,
                        thumbnail: thumbUrl,
                        title: videoSearchResult.title,
                        body: developer,
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo
                        }
                    });

                    (async () => {
                        try {
                            const scraperResult = await descargarMusicaDix(videoUrl);
                            const downloadUrl = scraperResult.downloadURL;

                            const workerResponse = await dispatchMediaTask({ type: 'download_buffer', url: downloadUrl });
                            if (!workerResponse || !workerResponse.buffer) throw new Error('Error al descargar el búfer de audio desde el worker.');

                            const audioTitle = scraperResult.title || videoSearchResult.title;
                            const captionWithCredit = `${audioTitle}\n\n> *Descargado mediante Y2Mate.gs*`;

                            if (isDocument) {
                                let processedThumbnail = Buffer.alloc(0);
                                try {
                                    const thumbRes = await fetch(thumbUrl, { headers: { 'User-Agent': UA } }).then(res => res.arrayBuffer());
                                    processedThumbnail = await (await pix.read(Buffer.from(thumbRes)))
                                        .resize(300, 300, { fit: 'cover' })
                                        .jpeg({ quality: 80 })
                                        .toBuffer();
                                } catch (e) {
                                    processedThumbnail = Buffer.alloc(0);
                                }

                                await conn.sendMessage(m.chat, {
                                    document: workerResponse.buffer,
                                    mimetype: 'audio/mpeg',
                                    fileName: `${audioTitle}.mp3`,
                                    caption: captionWithCredit,
                                    jpegThumbnail: processedThumbnail,
                                    contextInfo: { ...global.channelInfo }
                                }, { quoted: m });
                            } else {
                                await conn.sendMessage(m.chat, {
                                    audio: workerResponse.buffer,
                                    mimetype: 'audio/mpeg',
                                    ptt: false,
                                    caption: captionWithCredit
                                }, { quoted: m });
                            }
                        } catch (parallelError) {
                            const errMsg = parallelError?.response?.data?.message || parallelError?.message || String(parallelError);
                            conn.reply(m.chat, `Error al procesar la descarga de audio: ${errMsg}`, m);
                        }
                    })();

                } catch (error) {
                    const mainErrMsg = error?.message || String(error) || 'Error interno no especificado';
                    conn.reply(m.chat, `Error: ${mainErrMsg}`, m);
                }
            }
        }
    }
};
