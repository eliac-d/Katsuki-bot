import { dirname } from "path";
import { fileURLToPath } from "url";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import webp from "node-webpmux";
import { createCanvas, loadImage, GlobalFonts } from '@napi-rs/canvas';
import * as pix from 'pixcore';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function loadFonts() {
    try {
        const fontDir = path.join(__dirname, '../../tmp/fonts');
        if (!fs.existsSync(fontDir)) fs.mkdirSync(fontDir, { recursive: true });

        const regularPath = path.join(fontDir, 'Roboto-Regular.ttf');
        const boldPath = path.join(fontDir, 'Roboto-Bold.ttf');

        if (!fs.existsSync(regularPath)) {
            const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Regular.ttf');
            const arrayBuffer = await res.arrayBuffer();
            fs.writeFileSync(regularPath, Buffer.from(arrayBuffer));
        }

        if (!fs.existsSync(boldPath)) {
            const res = await fetch('https://raw.githubusercontent.com/google/fonts/main/apache/roboto/static/Roboto-Bold.ttf');
            const arrayBuffer = await res.arrayBuffer();
            fs.writeFileSync(boldPath, Buffer.from(arrayBuffer));
        }

        GlobalFonts.registerFromPath(regularPath, 'RobotoCustom');
        GlobalFonts.registerFromPath(boldPath, 'RobotoCustomBold');
    } catch (e) {
        console.error('Error cargando fuentes personalizadas:', e);
    }
}

loadFonts();

async function addExif(webpSticker, packname, author, categories = ["🤩"], extra = {}) {
    const img = new webp.Image();
    const json = {
        "sticker-pack-id": crypto.randomBytes(32).toString("hex"),
        "sticker-pack-name": packname,
        "sticker-pack-publisher": author,
        emojis: categories,
        ...extra,
    };
    const exifAttr = Buffer.from([
        0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
        0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuffer = Buffer.from(JSON.stringify(json), "utf8");
    const exif = Buffer.concat([exifAttr, jsonBuffer]);
    exif.writeUIntLE(jsonBuffer.length, 14, 4);
    await img.load(webpSticker);
    img.exif = exif;
    return await img.save(null);
}

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let lines = [];
    let currentLine = words[0] || '';

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + " " + word).width;
        if (width < maxWidth) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);
    return lines;
}

export const qcCommand = {
    category: 'tools',
    commands: {
        qc: {
            name: 'qc',
            alias: ['quote'],
            run: async (m, { conn, text }) => {
                try {
                    let mentioned = m.mentionedJid || m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
                    let who = mentioned.length > 0 ? mentioned[0] : (m.quoted ? m.quoted.sender : m.sender);

                    let realText = text ? text.replace(/@\d+/g, '').replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim() : (m.quoted ? m.quoted.text : null);

                    if (!realText) return m.reply(`> *✎ Ingresa un texto.*`);
                    if (realText.length > 50) return m.reply(`> *⚠ Máximo 50 caracteres.*`);

                    await m.react('🕓');

                    const pp = await conn.profilePictureUrl(who, 'image').catch(() => 
                        conn.profilePictureUrl(m.sender, 'image').catch(() => 'https://telegra.ph/file/24fa902ead26340f3df2c.png')
                    );

                    let targetUser = await global.User?.findOne({ id: who });
                    let nombre = targetUser?.name || (m.quoted && m.quoted.sender === who ? m.quoted.pushName : null);

                    if (!nombre) {
                        try {
                            nombre = await conn.getName(who);
                        } catch {
                            nombre = who.split('@')[0].replace(/\D/g, '');
                        }
                    }

                    if (!nombre || /^\d+$/.test(nombre)) {
                        nombre = `User_${who.split('@')[0].slice(-4)}`;
                    }

                    const dummyCanvas = createCanvas(100, 100);
                    const dummyCtx = dummyCanvas.getContext('2d');

                    const fontBold = GlobalFonts.has('RobotoCustomBold') ? 'RobotoCustomBold' : 'sans-serif';
                    const fontRegular = GlobalFonts.has('RobotoCustom') ? 'RobotoCustom' : 'sans-serif';

                    dummyCtx.font = `bold 42px ${fontBold}`;
                    const nameWidth = dummyCtx.measureText(nombre).width;

                    dummyCtx.font = `36px ${fontRegular}`;
                    const maxTextWidth = 550;
                    const lines = wrapText(dummyCtx, realText, maxTextWidth);

                    let maxLineWidth = nameWidth;
                    for (const line of lines) {
                        const lw = dummyCtx.measureText(line).width;
                        if (lw > maxLineWidth) maxLineWidth = lw;
                    }

                    const avatarSize = 120;
                    const paddingHorizontal = 35;
                    const paddingVertical = 30;
                    const spacing = 20;
                    const lineHeight = 46;

                    const bubbleWidth = Math.min(Math.max(maxLineWidth + paddingHorizontal * 2, 340), 680);
                    const bubbleHeight = Math.max(avatarSize, paddingVertical * 2 + 40 + lines.length * lineHeight);

                    const totalWidth = avatarSize + spacing + bubbleWidth + 20;
                    const totalHeight = Math.max(avatarSize, bubbleHeight) + 20;

                    const canvas = createCanvas(totalWidth, totalHeight);
                    const ctx = canvas.getContext('2d');

                    const avatarX = 10;
                    const avatarY = (totalHeight - avatarSize) / 2;
                    const bubbleX = avatarX + avatarSize + spacing;
                    const bubbleY = (totalHeight - bubbleHeight) / 2;

                    ctx.beginPath();
                    ctx.fillStyle = '#1f2c34';
                    ctx.roundRect(bubbleX, bubbleY, bubbleWidth, bubbleHeight, 30);
                    ctx.fill();

                    let avatarImg;
                    try {
                        avatarImg = await loadImage(pp);
                    } catch {
                        avatarImg = await loadImage('https://telegra.ph/file/24fa902ead26340f3df2c.png');
                    }

                    ctx.save();
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                    ctx.drawImage(avatarImg, avatarX, avatarY, avatarSize, avatarSize);
                    ctx.restore();

                    ctx.font = `bold 42px ${fontBold}`;
                    ctx.fillStyle = '#e53935';
                    ctx.fillText(nombre, bubbleX + paddingHorizontal, bubbleY + paddingVertical + 32);

                    ctx.font = `36px ${fontRegular}`;
                    ctx.fillStyle = '#ffffff';
                    let currentY = bubbleY + paddingVertical + 84;
                    for (const line of lines) {
                        ctx.fillText(line, bubbleX + paddingHorizontal, currentY);
                        currentY += lineHeight;
                    }

                    const buffer = canvas.toBuffer('image/png');
                    
                    let stikerBuffer = await (await pix.read(buffer))
                        .resize(512, 512, { fit: 'contain' })
                        .webp({ quality: 100 })
                        .toBuffer();

                    let pack = typeof name === 'function' ? name(conn) : 'QC Sticker'; 
                    let auth = nombre;
                    let exifSticker = await addExif(stikerBuffer, pack, auth);

                    await conn.sendMessage(m.chat, { 
                        sticker: exifSticker,
                        contextInfo: {
                            forwardingScore: 1, 
                            isForwarded: true,
                            ...(typeof channelInfo !== 'undefined' ? channelInfo : {})
                        }
                    }, { quoted: m });
                    await m.react('✅');

                } catch (e) {
                    console.error('Error en QC:', e);
                    await m.react('✖️');
                }
            }
        }
    }
};