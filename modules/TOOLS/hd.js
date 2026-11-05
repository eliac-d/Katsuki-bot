import fetch from 'node-fetch';
import FormData from 'form-data';
import { Buffer } from 'node:buffer';

const DIX_API_KEY = apikey;

export const hdCommand = {
    category: 'tools',
    commands: {
        hd: {
            name: 'hd',
            alias: ['remini', 'upscale', 'mejorar'],
            run: async (m, { conn }) => {
                const q = m.quoted ? m.quoted : m;
                try {
                    const mime = (q.msg || q).mimetype || q.mediaType || '';
                    if (!mime || !mime.startsWith('image/')) {
                        return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: Envía o responde a una imagen.');
                    }

                    await m.react('⚙️');

                    const buffer = await q.download();
                    if (!buffer) {
                        await m.react('✖️');
                        return m.reply('❯❯ 𝗘𝗥𝗥𝗢𝗥: No se pudo descargar la imagen.');
                    }

                    const enhancedBuffer = await enhanceImage(buffer, mime);

                    await conn.sendMessage(m.chat, {
                        image: enhancedBuffer,
                        caption: `❯❯ 𝗦𝗬𝗦𝗧𝗘𝗠 𝗔𝗨𝗧𝗢𝗠𝗔𝗧𝗜𝗢𝗡\n\n❖ 𝗘𝗦𝗧𝗔𝗧𝗨𝗦: Optimizada\n❖ 𝗔𝗣𝗜: dix.lat/v1/hd`
                    }, { quoted: m });

                    await m.react('✅');
                } catch (error) {
                    console.error(error);
                    await m.react('✖️');
                    m.reply(`❯❯ 𝗘𝗥𝗥𝗢𝗥: ${error.message}`);
                }
            }
        }
    }
};

async function enhanceImage(buffer, mimetype = 'image/jpeg') {
    if (!buffer || !Buffer.isBuffer(buffer)) throw new Error('Imagen requerida');

    const ext = mimetype.split('/')[1] || 'jpg';
    const form = new FormData();
    form.append('file', buffer, {
        filename: `file_${Date.now()}.${ext}`,
        contentType: mimetype
    });

    const res = await fetch('https://dix.lat/v1/hd', {
        method: 'POST',
        headers: {
            'x-api-key': DIX_API_KEY,
            ...form.getHeaders()
        },
        body: form
    });

    if (!res.ok) {
        throw new Error(`API respondió ${res.status} ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const result = Buffer.from(arrayBuffer);

    if (!result.length) {
        throw new Error('La API devolvió una imagen vacía.');
    }

    const isImage =
        (result[0] === 0xff && result[1] === 0xd8) ||
        (result[0] === 0x89 && result[1] === 0x50) ||
        (result[0] === 0x52 && result[1] === 0x49) ||
        (result[0] === 0x47 && result[1] === 0x49);

    if (!isImage) {
        throw new Error('La respuesta no es una imagen válida.');
    }

    return result;
}