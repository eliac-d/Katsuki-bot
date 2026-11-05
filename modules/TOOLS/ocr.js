import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';
import FormData from 'form-data';

const pkgPath = join(process.cwd(), 'package.json');
let pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

export const ocrCommand = {
    category: 'tools',
    commands: {
        ocr: {
            name: 'ocr',
            alias: ['read', 'extraertexto'],
            run: async (m, { conn }) => {
                try {
                    const quoted = m.quoted ? m.quoted : m;
                    const mime = (quoted.msg || quoted).mimetype || '';

                    if (!/image/.test(mime)) {
                        return await conn.sendMessage(
                            m.chat,
                            { text: '⚠️ Por favor, responde o envía una imagen para extraer el texto.' },
                            { quoted: m }
                        );
                    }

                    await conn.sendMessage(m.chat, { text: '⏳ Procesando imagen y escaneando texto...' }, { quoted: m });

                    let mediaBuffer;
                    if (typeof quoted.download === 'function') {
                        mediaBuffer = await quoted.download();
                    } else if (typeof conn.downloadMediaMessage === 'function') {
                        mediaBuffer = await conn.downloadMediaMessage(quoted);
                    }

                    if (!mediaBuffer || !Buffer.isBuffer(mediaBuffer)) {
                        return await conn.sendMessage(
                            m.chat,
                            { text: '❌ No se pudo descargar el archivo de la imagen.' },
                            { quoted: m }
                        );
                    }

                    const form = new FormData();
                    form.append('file', mediaBuffer, {
                        filename: 'upload.jpg',
                        contentType: mime
                    });

                    const cdnResponse = await fetch('https://cdn.dix.lat/upload/tmp?ttl=60', {
                        method: 'POST',
                        body: form,
                        headers: form.getHeaders()
                    });

                    const cdnData = await cdnResponse.json();

                    if (!cdnData || !cdnData.status || !cdnData.data || !cdnData.data.url) {
                        return await conn.sendMessage(
                            m.chat,
                            { text: '❌ Error al subir la imagen temporal al CDN.' },
                            { quoted: m }
                        );
                    }

                    const tempImageUrl = cdnData.data.url;
                    
                    const ocrApiUrl = `https://dix.lat/v1/ocr?url=${encodeURIComponent(tempImageUrl)}&apikey=${apikey}`;

                    const ocrResponse = await fetch(ocrApiUrl);
                    const ocrResult = await ocrResponse.json();

                    if (!ocrResult || !ocrResult.success || !ocrResult.data || !ocrResult.data.text) {
                        return await conn.sendMessage(
                            m.chat,
                            { text: '❌ No se logró detectar texto en la imagen proporcionada.' },
                            { quoted: m }
                        );
                    }

                    const extractedText = ocrResult.data.text.trim();
                    const responseMessage = `📄 *TEXTO DETECTADO (OCR)*\n\n${extractedText}`;

                    await conn.sendMessage(m.chat, { text: responseMessage }, { quoted: m });

                } catch (error) {
                    const errorReport = `❌ *REPORTE DE ERROR INTERNO*\n\n` +
                                        `• *Módulo:* ocr.js\n` +
                                        `• *Comando:* ocr\n` +
                                        `• *Error:* ${error.message}\n\n` +
                                        `*Trazado de la pila (Stack):*\n\`\`\`${error.stack}\`\`\``;

                    try {
                        await conn.sendMessage(m.chat, { text: errorReport }, { quoted: m });
                    } catch (sendError) {
                        console.error('Incapaz de transmitir el reporte de error al chat de origen:', sendError);
                    }
                }
            }
        }
    }
};
