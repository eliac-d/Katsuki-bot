import fs, { readFileSync } from 'fs';
import { join, resolve } from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import fetch from 'node-fetch';

const pkgPath = join(process.cwd(), 'package.json');
let pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

let cachedTotalReg = 0;
let cachedTotalChats = 0;

const dbPath = join(process.cwd(), 'database', 'local_db.json');

const readDb = () => {
    try {
        if (!fs.existsSync(dbPath)) return {};
        return JSON.parse(readFileSync(dbPath, 'utf-8'));
    } catch {
        return {};
    }
};

function getTotalCommands() {
    return global.commands ? global.commands.size : 0;
}

const getBotName = (conn) => (typeof name === 'function' ? name(conn) : (conn?.user?.name || 'Bot'));
const getDeveloperName = () => (typeof developer !== 'undefined' ? developer : 'Developer');


export const menuCommand = {
    category: 'main',
    commands: {
        help: {
            name: 'menu',
            alias: ['help', 'comandos', 'h'],
            run: async (m, { conn, text }) => {
                try {
                    let uptime = clockString(process.uptime() * 1000);
                    const rmrText = typeof global.rmr === 'string' ? global.rmr : 'Sʏsᴛᴇ模 V5.8.0';

                    const botJid = conn.user ? jidNormalizedUser(conn.user.id) : '';

                    const senderJid = m.sender || '';
                    const senderNum = senderJid ? senderJid.split('@')[0] : 'Usuario';

                    const db = readDb();
                    const isVipTrue = db.vip === true;

                    let menuText1 = `\n〔 Hello, my name is ${getBotName(conn)} 〕\n`;
                    menuText1 += `➥ ⋄ 𝚄𝚜𝚞𝚊𝚛𝚒𝚘 : @${m.sender.split('@')[0]}\n`;
                    menuText1 += `➥ ⋄ 𝙲𝚘𝚖𝚊𝚗𝚍𝚘𝚜: ${getTotalCommands()}\n`;
                    menuText1 += `➥ ⋄ 𝚄𝚙𝚝𝚒𝚖𝚎  : ${uptime}\n`;
                    menuText1 += `➥ ⋄ 𝙰𝚙𝚒  : https://dix.lat\n`;



                    menuText1 += `\n`;
                    let menuText = `${rmrText}\n\n`;

                    const categories = {};
                    if (global.commands) {
                        for (const [_, cmd] of global.commands.entries()) {
                            const cat = (cmd.category || 'general').toUpperCase();
                            const folder = cmd.folder ? cmd.folder.toUpperCase() : '';

                            if (cat === 'OWNER' || cat === 'prueba' || folder === 'PRUEBAS') continue;
                            if (isVipTrue && (cat === 'SUBBOTS' || folder === 'SUBBOTS')) continue;

                            if (!categories[cat]) categories[cat] = new Set();

                            let cmdDisplay = cmd.name;
                            if (cmd.alias && Array.isArray(cmd.alias) && cmd.alias.length > 0) {
                                cmdDisplay += ` (${cmd.alias.join(', ')})`;
                            }
                            categories[cat].add(cmdDisplay);
                        }
                    }

                    const query = (text || '').trim().toUpperCase();
                    if (query && categories[query]) {
                        menuText += `┌──「 *${query}* 」──\n`;
                        categories[query].forEach(cmdStr => { menuText += `┃ ♛ ${cmdStr}\n`; });
                        menuText += `└───────────────\n\n`;
                    } else {
                        for (const [title, cmds] of Object.entries(categories)) {
                            menuText += `┌──「 *${title}* 」──\n`;
                            cmds.forEach(cmdStr => { menuText += `┃ ♛ ${cmdStr}\n`; });
                            menuText += `└───────────────\n\n`;
                        }
                    }

                    menuText += `> © Powered by ${getDeveloperName()}.`;



                    let txt = `${menuText1}\n\n${menuText}`;

                    await conn.sendPreviewMessage(m.chat, txt, {
                        type: 1, 
                        ratio: 'landscape',
                        url: 'https://dix.lat',
                        thumbnail: img(conn),
                        title: name(conn),
                        body: developer,
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo
                        }
                    });

                } catch (error) {
                    const errorReport = `❌ *REPORT DE ERROR INTERNO*\n\n` +
                                        `• *Módulo:* help.js\n` +
                                        `• *Comando:* menu\n` +
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

function clockString(ms) {
    let h = Math.floor(ms / 3600000);
    let m = Math.floor(ms / 60000) % 60;
    let s = Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}
