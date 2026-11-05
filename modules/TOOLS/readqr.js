import fetch from 'node-fetch';
import FormData from 'form-data';

export const downloadsModule = {
    category: 'tools',
    commands: {
        readqr: {
            name: 'readqr',
            alias: ['leerqr', 'qrreader', 'scanqr'],
            run: async (m, { conn, text, command, usedPrefix }) => {
                
                const q = m.quoted ? m.quoted : m;
                const mime = (q.msg || q).mimetype || '';

                let apiUrl = `https://dix.lat/v1/readqr`;
                let options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'application/json'
                    },
                    timeout: 30000
                };

                try {
                    if (text && text.trim().startsWith('http')) {
                        const targetUrl = text.trim();
                        apiUrl += `&url=${encodeURIComponent(targetUrl)}`;
                        options.method = 'GET';
                    } else if (/image/.test(mime)) {
                        const imgBuffer = await q.download();
                        if (!imgBuffer) {
                            return conn.reply(m.chat, `❌ No se pudo descargar la imagen para leer el QR.`, m);
                        }

                        const form = new FormData();
                        form.append('file', imgBuffer, {
                            filename: 'qr_image.png',
                            contentType: mime || 'image/png'
                        });

                        options.method = 'POST';
                        options.body = form;
                        options.headers = {
                            ...options.headers,
                            ...form.getHeaders()
                        };
                    } else {
                        return conn.reply(m.chat, `*Uso:* ${usedPrefix + command} <URL de la imagen>\nO responde/envía una imagen con el comando.`, m);
                    }

                    

                    const response = await fetch(apiUrl, options);

                    if (!response.ok) {
                        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
                    }

                    const json = await response.json();

                    if (!json.success || !json.data || !json.data.result) {
                        return conn.reply(m.chat, `⚠️ No se pudo leer ningún código QR en la imagen proporcionada.`, m);
                    }

                    const { text: qrText, format, type } = json.data.result;

                    let outputMessage = `✅ *LECTURA DE CÓDIGO QR*\n\n`;
                    if (format) outputMessage += `📌 *Formato:* ${format}\n`;
                    if (type) outputMessage += `🏷️ *Tipo:* ${type}\n\n`;
                    outputMessage += `📄 *Resultado:*\n${qrText || 'Sin texto detectado.'}`;

                    await conn.reply(m.chat, outputMessage.trim(), m);

                } catch (error) {
                    console.error('Error en comando readqr:', error);

                    let safeError = error.message || 'Error desconocido';

                    if (global.key) {
                        safeError = safeError.replace(new RegExp(global.key, 'g'), '***HIDDEN_KEY***');
                    }
                    if (global.dixKey) {
                        safeError = safeError.replace(new RegExp(global.dixKey, 'g'), '***HIDDEN_KEY***');
                    }
                    safeError = safeError.replace(/https?:\/\/[^\s]+/g, '[URL]');

                    await conn.reply(m.chat, `❌ Error al leer el código QR:\n\n${safeError}`, m);
                }
            }
        }
    }
};
