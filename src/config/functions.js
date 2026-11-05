import { jidNormalizedUser } from '@whiskeysockets/baileys';
import axios from 'axios';
import { promises as fs, readFileSync } from 'fs';
import path from 'path';
import FormData from 'form-data';

const defaultChannel = '120363406846602793@newsletter';

global.customBotConfigs = global.customBotConfigs || new Map();

global.surl = (c) => {
    const key = formatJid(typeof c !== 'undefined' ? c : global.conn);
    const custom = global.customBotConfigs.get(key);
    return custom?.url || 'https://dix.lat/s/channel';
};

const defaultBotNames = [
    '𝐊𝐚𝐭𝐬𝐮𝐤𝐢 𝐌𝐃',
    '𝐊𝐚𝐭𝐬𝐮𝐤𝐢 𝐁𝐨𝐭',
    'ᴋᴀᴛsᴜᴋɪ ᴍᴅ',
    'ᴋᴀᴛsᴜᴋɪ ʙᴏᴛ',
    '𝑩𝒂𝒌𝒖𝒈𝒐 𝑴𝑫',
    '𝑩𝒂𝒌𝒖𝒈𝒐 𝑩𝒐𝒕',
    'ʙᴀᴋᴜɢᴏ ᴍᴅ',
    'ʙᴀᴋᴜɢᴏ ʙᴏᴛ',
    '𝖪𝖺𝗍𝗌𝗎𝗍𝗂 𝖬𝖖',
    '𝖡𝖺𝗄𝗎𝗀𝗈 𝖡𝒐𝒕'
];

const defaultBotImages = [
    'https://cdn.dix.lat/me/0lkj_20260829-c91x-2p9h-f407.png',
    'https://cdn.dix.lat/me/138d_20260829-c91x-hp1s-a51f.jpg',
    'https://cdn.dix.lat/me/e9jz_20260829-c91x-4tv6-9982.jpg',
    'https://cdn.dix.lat/me/8cit_20260829-c91x-zss9-92ac.jpg',
    'https://cdn.dix.lat/me/oaq9_20260829-c91x-t2de-31a0.jpg'
];

global.botStylesMap = global.botStylesMap || new Map();
global.botNames = defaultBotNames;
global.botImages = defaultBotImages;

const formatJid = (jid) => {
    if (!jid) return '';
    let rawJid = jid;
    if (typeof jid === 'object') {
        rawJid = jid?.user?.id || jid?.user?.jid || jid?.id || '';
    }
    if (typeof rawJid !== 'string') return '';
    const clean = rawJid.split('@')[0].split(':')[0];
    return `${clean}@s.whatsapp.net`;
};

const stylesPath = path.join(process.cwd(), 'src', 'bot_styles.json');

export function loadAllStyles() {
    try {
        const rawData = readFileSync(stylesPath, 'utf-8');
        const styles = JSON.parse(rawData);

        global.botStylesMap.clear();
        global.customBotConfigs.clear();

        for (const key of Object.keys(styles)) {
            const style = styles[key];

            if (key.startsWith('custom_')) {
                const targetJid = key.replace('custom_', '');
                global.customBotConfigs.set(targetJid, {
                    name: style.botNames?.[0] || null,
                    images: Array.isArray(style.botImages) && style.botImages.length > 0 ? style.botImages : null,
                    channelJid: style.channelJid || defaultChannel,
                    url: style.url || 'https://dix.lat/s/channel'
                });
                continue;
            }

            const names = style.botNames && style.botNames.length ? style.botNames : defaultBotNames;
            const images = style.botImages && style.botImages.length ? style.botImages : defaultBotImages;

            if (Array.isArray(style.ids)) {
                for (const id of style.ids) {
                    const clean = formatJid(id);
                    if (clean) {
                        global.botStylesMap.set(clean, { names, images });
                    }
                }
            }
        }
    } catch (e) {
        console.error("Error al cargar todos los estilos:", e);
    }
}

loadAllStyles();

global.name = (botJid) => {
    const key = formatJid(botJid);
    const custom = global.customBotConfigs.get(key);
    if (custom && custom.name) return custom.name;

    const config = global.botStylesMap.get(key);
    const list = (config && config.names && config.names.length) ? config.names : global.botNames;
    return list[Math.floor(Math.random() * list.length)];
};

global.img = (botJid) => {
    const key = formatJid(botJid);
    const custom = global.customBotConfigs.get(key);
    if (custom && Array.isArray(custom.images) && custom.images.length > 0) {
        return custom.images[Math.floor(Math.random() * custom.images.length)];
    }

    const config = global.botStylesMap.get(key);
    const list = (config && config.images && config.images.length) ? config.images : global.botImages;
    return list[Math.floor(Math.random() * list.length)];
};

global.channelInfo = {
    forwardingScore: 1,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        get newsletterJid() {
            const key = formatJid(typeof conn !== 'undefined' ? conn : global.conn);
            const custom = global.customBotConfigs.get(key);
            return custom?.channelJid || defaultChannel;
        },
        get newsletterName() {
            return global.name(typeof conn !== 'undefined' ? conn : global.conn);
        }
    }
};

export async function loadBotStyle(botJid) {
    loadAllStyles();
}

export async function setBotStyle(botJid, styleId) {
    const cleanJid = formatJid(botJid);
    let styles = {};

    try {
        const rawData = await fs.readFile(stylesPath, 'utf-8');
        styles = JSON.parse(rawData);
    } catch (e) {
        return { success: false, error: "FILE_READ_ERROR" };
    }

    if (!styles[styleId]) {
        return { success: false, error: "STYLE_NOT_FOUND" };
    }

    for (const key of Object.keys(styles)) {
        if (Array.isArray(styles[key].ids)) {
            styles[key].ids = styles[key].ids.filter(id => formatJid(id) !== cleanJid);
        }
    }

    delete styles[`custom_${cleanJid}`];

    if (!Array.isArray(styles[styleId].ids)) {
        styles[styleId].ids = [];
    }

    styles[styleId].ids.push(cleanJid);

    await fs.writeFile(stylesPath, JSON.stringify(styles, null, 2), 'utf-8');
    loadAllStyles();

    return { success: true, name: styles[styleId].name || `Estilo ${styleId}` };
}

export async function getStylesList(botJid) {
    const cleanJid = formatJid(botJid);
    try {
        const rawData = await fs.readFile(stylesPath, 'utf-8');
        const styles = JSON.parse(rawData);

        return Object.keys(styles)
            .filter(key => !key.startsWith('custom_'))
            .map(key => {
                const style = styles[key];
                const isCurrent = Array.isArray(style.ids) && style.ids.some(id => formatJid(id) === cleanJid);
                return {
                    id: key,
                    name: style.name || 'Sin Nombre',
                    isCurrent,
                    namesCount: style.botNames ? style.botNames.length : 0,
                    imagesCount: style.botImages ? style.botImages.length : 0
                };
            });
    } catch (e) {
        return [];
    }
}

async function uploadToDixCdn(buffer) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename: 'custom_avatar.jpg' });

        const response = await axios.post('https://cdn.dix.lat/upload/tmp?ttl=2592000', form, {
            headers: {
                ...form.getHeaders()
            }
        });

        if (response.data && response.data.status && response.data.data?.url) {
            return response.data.data.url;
        }
        return null;
    } catch (e) {
        console.error("Error al subir imagen a Dix CDN:", e);
        return null;
    }
}

export async function setCustomBotConfig(botJid, options = {}) {
    const cleanJid = formatJid(botJid);
    let styles = {};

    try {
        const rawData = await fs.readFile(stylesPath, 'utf-8');
        styles = JSON.parse(rawData);
    } catch (e) {
        styles = {};
    }

    for (const key of Object.keys(styles)) {
        if (Array.isArray(styles[key].ids)) {
            styles[key].ids = styles[key].ids.filter(id => formatJid(id) !== cleanJid);
        }
    }

    const customKey = `custom_${cleanJid}`;
    const existingCustom = styles[customKey] || {};

    let finalImageUrl = options.imageUrl || null;
    if (!finalImageUrl && options.imageBuffer) {
        finalImageUrl = await uploadToDixCdn(options.imageBuffer);
    }

    const botNames = options.name ? [options.name] : (existingCustom.botNames || defaultBotNames);
    const botImages = finalImageUrl ? [finalImageUrl] : (existingCustom.botImages || []);
    const channelJid = options.channelJid || existingCustom.channelJid || defaultChannel;
    const url = options.url || existingCustom.url || 'https://dix.lat/s/channel';

    styles[customKey] = {
        name: `Personalizado (${cleanJid})`,
        botNames,
        botImages,
        channelJid,
        url
    };

    await fs.writeFile(stylesPath, JSON.stringify(styles, null, 2), 'utf-8');
    loadAllStyles();

    return {
        success: true,
        data: {
            name: botNames[0],
            channelJid,
            url,
            hasCustomImage: botImages.length > 0
        }
    };
}

global.bufferCache = global.bufferCache || new Map();
global.getBuffer = async (u, o = {}) => {
    try {
        let r = await axios.get(u, { ...o, responseType: 'arraybuffer' });
        return r.status === 200 ? r.data : null;
    } catch { return null; }
};
