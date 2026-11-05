import fetch from "node-fetch";
import { FormData, Blob } from "formdata-node";
import { fileTypeFromBuffer } from "file-type";

export const uploadCommand = {
    category: 'tools',
    commands: {
        upload: {
            name: 'upload',
            alias: ['tourl', 'dixup'],
            run: async (m, { conn, command }) => {
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
                    if (mime && /image|video|audio/.test(mime)) {
                        targets = [q];
                    }
                }

                if (!targets || targets.length === 0) {
                    return m.reply(`> ✰⋆͙̈ Responde a una imagen, video, audio o un álbum de imágenes con el comando ➠ *${command}*`);
                }

                await m.react('🕒');

                try {
                    let uploadedFiles = [];

                    for (const item of targets) {
                        try {
                            let mime = (item.msg || item).mimetype || '';
                            let buffer = await item.download();
                            if (!buffer) continue;

                            const type = await fileTypeFromBuffer(buffer);
                            const fileName = `file_${Date.now()}_${Math.floor(Math.random() * 1000)}.${type?.ext || 'bin'}`;

                            const formData = new FormData();
                            const blob = new Blob([buffer], { type: mime || type?.mime || 'application/octet-stream' });
                            formData.append('file', blob, fileName);

                            const response = await fetch('https://cdn.dix.lat/upload', {
                                method: 'POST',
                                body: formData,
                                headers: { 'User-Agent': 'Drive-Client' }
                            });

                            const json = await response.json();

                            if (json.status && json.data) {
                                uploadedFiles.push(json.data);
                            }
                        } catch (err) {
                            continue;
                        }
                    }

                    if (uploadedFiles.length > 0) {
                        let txt = `*── 「 DIX.LAT CDN 」 ──*\n\n`;

                        if (uploadedFiles.length === 1) {
                            let result = uploadedFiles[0];
                            txt += `▢ *ID:* ${result.public_id}\n`;
                            txt += `▢ *URL:* ${result.url}\n\n`;
                        } else {
                            txt += `*Archivos subidos (${uploadedFiles.length}):*\n\n`;
                            uploadedFiles.forEach((file, index) => {
                                txt += `*${index + 1}.* ${file.url}\n`;
                            });
                            txt += `\n`;
                        }

                        txt += `> *Powered by dix.lat - Deylin.*`;

                        await conn.sendMessage(m.chat, { text: txt }, { quoted: m });
                        await m.react('✅');
                    } else {
                        await m.react('❌');
                        m.reply("> ⚔ Error al subir los archivos al servidor.");
                    }
                } catch (e) {
                    await m.react('❌');
                    m.reply(`> ⚔ Error: ${e.message}`);
                }
            }
        }
    }
};
