import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

export const tmpUploadCommand = {
    category: 'tools',
    commands: {
        tmp: {
            name: 'tmp',
            alias: ['temporal', 'tmptime'],
            run: async (m, { conn, command, args }) => {
                let targets = [];

                let q = m.quoted ? m.quoted : m;

                if (typeof q.getAlbum === 'function') {
                    try {
                        targets = await q.getAlbum();
                    } catch (e) {
                        targets = [];
                    }
                } else if (typeof m.getAlbum === 'function') {
                    try {
                        targets = await m.getAlbum();
                    } catch (e) {
                        targets = [];
                    }
                } else if (Array.isArray(m.album)) {
                    targets = m.album;
                } else if (Array.isArray(q.album)) {
                    targets = q.album;
                }

                if (!targets || targets.length === 0) {
                    let mime = (q.msg || q).mimetype || '';
                    
                    if (mime || (q.msg || q).fileSha256 || q.download) {
                        targets = [q];
                    }
                }

                if (!targets || targets.length === 0) {
                    return m.reply(`> ✰⋆͙̈ Responde a una imagen, video, audio, documento o un álbum con el comando ➠ *${command}*`);
                }

                await m.react('🕒');

                try {
                    let ttl = args[0] ? parseInt(args[0]) : 86400; 
                    if (isNaN(ttl)) ttl = 86400;

                    let uploadedFiles = [];

                    for (const item of targets) {
                        try {
                            let mime = (item.msg || item).mimetype || '';
                            let buffer = await item.download();
                            if (!buffer) continue;

                            const type = await fileTypeFromBuffer(buffer);
                            const fileName = `tmp_${Date.now()}_${Math.floor(Math.random() * 1000)}.${type?.ext || 'bin'}`;

                            const formData = new FormData();
                            const blob = new Blob([buffer], { type: mime || type?.mime || 'application/octet-stream' });
                            formData.append('file', blob, fileName);

                            const apiUrl = `https://cdn.dix.lat/upload/tmp?ttl=${ttl}`;

                            const response = await fetch(apiUrl, {
                                method: 'POST',
                                body: formData,
                                headers: { 'User-Agent': 'Drive-Client-Temp' }
                            });

                            const responseText = await response.text();
                            let json;

                            try {
                                json = JSON.parse(responseText);
                            } catch (e) {
                                continue;
                            }

                            if (json.status && json.data) {
                                uploadedFiles.push(json.data);
                            }
                        } catch (err) {
                            continue;
                        }
                    }

                    if (uploadedFiles.length > 0) {
                        let txt = `*── 「 DIX.LAT TEMPORAL 」 ──*\n\n`;

                        if (uploadedFiles.length === 1) {
                            let result = uploadedFiles[0];
                            let expDate = new Date(result.expires * 1000).toLocaleString('es-HN');
                            txt += `▢ *ID:* ${result.public_id}\n`;
                            txt += `▢ *EXPIRA:* ${expDate}\n`;
                            txt += `▢ *URL:* ${result.url}\n\n`;
                        } else {
                            let expDate = new Date(uploadedFiles[0].expires * 1000).toLocaleString('es-HN');
                            txt += `*Archivos temporales subidos (${uploadedFiles.length}):*\n`;
                            txt += `▢ *EXPIRA:* ${expDate}\n\n`;
                            uploadedFiles.forEach((file, index) => {
                                txt += `*${index + 1}.* ${file.url}\n`;
                            });
                            txt += `\n`;
                        }

                        txt += `> *Este archivo se eliminará automáticamente.*`;

                        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('❌');
                        m.reply("> ⚔ Error al subir los archivos temporales al servidor.");
                    }
                } catch (e) {
                    await m.react('❌');
                    m.reply(`> ⚔ *Error Crítico en el Cliente:*\n> ${e.message}`);
                }
            }
        }
    }
};
