import fetch from 'node-fetch';
import { FormData, Blob } from 'formdata-node';
import { fileTypeFromBuffer } from 'file-type';
import axios from 'axios';

const UA = 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36';
const API_KEY = apikey;

export const transcribeModule = {
    category: 'tools',
    commands: {
        transcribe: {
            name: 'transcribe',
            alias: ['transcribir', 'totext', 'to-text', 'iaaudio'],
            run: async (m, { conn, usedPrefix, command }) => {
                try {
                    const q = m.quoted ? m.quoted : m;
                    const mime = (q.msg || q).mimetype || '';

                    if (!/audio|video/.test(mime)) {
                        return conn.reply(m.chat, `*Uso:* Responde a un mensaje de audio o video con el comando *${usedPrefix + command}* para obtener la transcripción en texto.`, m);
                    }

                    await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });

                    const buffer = await q.download();
                    if (!buffer) {
                        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                        return conn.reply(m.chat, 'Error al obtener el archivo multimedia.', m);
                    }

                    const type = await fileTypeFromBuffer(buffer);
                    const ext = type?.ext || 'opus';
                    const fileName = `audio_${Date.now()}.${ext}`;

                    const formData = new FormData();
                    const blob = new Blob([buffer], { type: mime || 'audio/ogg' });
                    formData.append('file', blob, fileName);

                    const response = await axios.post('https://dix.lat/v1/transcribe', formData, {
                        headers: {
                            'x-api-key': apikey,
                            'User-Agent': UA,
                            ...formData.headers
                        }
                    });

                    const json = response.data;

                    if (!json || !json.success || !json.data || !json.data.text) {
                        await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                        return conn.reply(m.chat, 'Error en la respuesta de la API Dix Transcribe.', m);
                    }

                    await conn.sendMessage(m.chat, { react: { text: '✅', key: m.key } });

                    const textMessage = `∆ *TRANSCRIPCIÓN* ∆\n\n` +
                        `• *Texto:* \n${json.data.text.trim()}`;

                    await conn.sendMessage(m.chat, { text: textMessage }, { quoted: m });

                } catch (error) {
                    console.error('Error en transcripción de audio:', error);
                    await conn.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
                    conn.reply(m.chat, `Error al procesar el audio: ${error.message}`, m);
                    }
            }
        }
    }
};
