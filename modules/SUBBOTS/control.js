import { promises as fs } from 'fs';
import path from 'path';
import { setBotStyle, getStylesList, setCustomBotConfig } from '../../src/config/functions.js';

const DB_PATH = path.resolve('database/local_db.json');
const ALLOWED_PREFIXES = ['#', '/', '!', '.', '?'];

const cleanJid = (jid) => {
    if (!jid) return '';
    const [user, server] = jid.split('@');
    return `${user.split(':')[0]}@${server || 's.whatsapp.net'}`;
};

async function getPrefixes(botJid) {
    try {
        const rawDb = await fs.readFile(DB_PATH, 'utf-8').catch(() => null);
        if (!rawDb) return null;
        const db = JSON.parse(rawDb);
        return db.prefixes?.[botJid] || null;
    } catch {
        return null;
    }
}

async function setPrefixes(botJid, newPrefixes) {
    try {
        let db = {};
        const rawDb = await fs.readFile(DB_PATH, 'utf-8').catch(() => null);
        if (rawDb) {
            try {
                db = JSON.parse(rawDb);
            } catch {
                db = {};
            }
        }
        if (!db.prefixes) db.prefixes = {};
        db.prefixes[botJid] = newPrefixes;
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
}

export const botControl = {
    category: 'subbots',
    commands: {
        bot: {
            name: 'bot',
            alias: ['enable', 'onchat'],
            admin: false,
            rowner: false,
            isPrem: true,
            self: true,
            run: async (m, { conn, args, usedPrefix, command, isROwner, isAdmin }) => {
                try {
                    if (!m.isGroup) return m.reply("『 ℹ️ 』 Función limitada a terminales de grupo.");
                    if (!isAdmin && !isROwner) return global.dfail('admin', m, conn);
                    if (!global.Chat) return;

                    let chat = await global.Chat.findOne({ id: m.chat });
                    if (!chat) chat = await global.Chat.create({ id: m.chat, isBanned: false });

                    const action = args[0]?.toLowerCase();

                    if (action === 'off') {
                        if (chat.isBanned) return m.reply("『 ⚠️ 』 Sistema offline.");
                        await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: true } });
                        await m.react("✖️");
                        return conn.sendMessage(m.chat, { 
                            text: `◆ Estado: desactivado.\n◆  Desactivado por: @${m.sender.split('@')[0]}\n\n⌬ Reactivación: ${usedPrefix + command} on`,
                            mentions: [m.sender],
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    if (action === 'on') {
                        if (!chat.isBanned) return m.reply("『 ⚠️ 』 Sistema online.");
                        await global.Chat.updateOne({ id: m.chat }, { $set: { isBanned: false } });
                        await m.react("✔️");
                        return conn.sendMessage(m.chat, { 
                            text: `◆ Estado: Operativo.`,
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    const status = chat.isBanned ? '✖ SUSPENDIDO' : '⌬ OPERATIVO';
                    return conn.sendMessage(m.chat, { 
                        text: `『 ⚙ CONTROL DE ENLACE 』\n\n◈ ESTADO: ${status}\n◈ MÉTODO: ${usedPrefix + command} [on/off]`,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });
                } catch (e) {
                    console.error(e);
                }
            }
        },
        setstyle: {
            name: 'setstyle',
            alias: ['estilo', 'cambiarestilo', 'personaje'],
            admin: false,
            rowner: false,
            isPrem: false,
            self: true,
            run: async (m, { conn, args, usedPrefix }) => {
                try {
                    const botJid = cleanJid(conn.user.id);

                    if (!args[0]) {
                        const styles = await getStylesList(botJid);

                        if (!styles || styles.length === 0) {
                            return m.reply("『 ⚠️ 』 No se pudieron obtener los estilos disponibles.");
                        }

                        let text = `『 🎨 ESTILOS DISPONIBLES 』\n\n`;
                        for (const style of styles) {
                            text += `• *Estilo ${style.id}:* ${style.name}${style.isCurrent ? ' (ACTIVO)' : ''}\n`;
                            text += `  └ Nombres: ${style.namesCount} | Imágenes: ${style.imagesCount}\n\n`;
                        }
                        text += `📌 *Uso:* ${usedPrefix}setstyle [número]\nEjemplo: ${usedPrefix}setstyle 2`;

                        return conn.sendMessage(m.chat, { 
                            text,
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    const selectedStyle = args[0].trim();
                    const result = await setBotStyle(botJid, selectedStyle);

                    if (!result.success) {
                        if (result.error === "STYLE_NOT_FOUND") {
                            return m.reply(`『 ⚠️ 』 El estilo *${selectedStyle}* no existe.`);
                        }
                        return m.reply("『 ⚠️ 』 Error al acceder a la base de datos de estilos.");
                    }

                    await m.react("🎨");
                    return conn.sendMessage(m.chat, { 
                        image: { url: global.img(conn) },
                        caption: `『 🎨 PERSONAJE ACTUALIZADO 』\n\n◆ Estilo Aplicado: *${result.name}* (ID: ${selectedStyle})\n◆ Bot ID: @${botJid.split('@')[0]}\n\nLos nombres y avatares se han actualizado correctamente.`,
                        mentions: [botJid],
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    return m.reply("『 ❌ 』 Ocurrió un error al procesar el cambio de estilo.");
                }
            }
        },
        setprefix: {
            name: 'setprefix',
            alias: ['prefix', 'prefijo', 'cambiarprefijo'],
            admin: false,
            rowner: false,
            isPrem: false,
            self: true,
            run: async (m, { conn, args, usedPrefix, isROwner, isAdmin }) => {
                try {
                    if (m.isGroup && !isAdmin && !isROwner) return global.dfail('admin', m, conn);
                    if (!m.isGroup && !isROwner) return global.dfail('rowner', m, conn);

                    const botJid = cleanJid(conn.user.id);
                    const currentPrefixes = await getPrefixes(botJid) || ['.', '#', '/', '!'];

                    if (!args[0]) {
                        return conn.sendMessage(m.chat, {
                            text: `『 ⚙︎ CONFIGURACIÓN DE PREFIJOS 』\n\n◆ Bot ID: @${botJid.split('@')[0]}\n◆ Prefijos Actuales: ${currentPrefixes.map(p => `\`${p}\``).join(' ')}\n◆ Prefijos Permitidos: ${ALLOWED_PREFIXES.map(p => `\`${p}\``).join(' ')}\n\n📌 *Uso:* ${usedPrefix}setprefix [simbolos]\nEjemplo: ${usedPrefix}setprefix ! . #`,
                            mentions: [botJid],
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    const requestedPrefixes = [...new Set(args.map(p => p.trim()).filter(Boolean))];
                    const validPrefixes = requestedPrefixes.filter(p => ALLOWED_PREFIXES.includes(p));

                    if (validPrefixes.length === 0) {
                        return m.reply(`『 ⚠️ 』 Ninguno de los prefijos ingresados es válido.\n\nSolo se permiten los siguientes prefijos:\n${ALLOWED_PREFIXES.map(p => `\`${p}\``).join(' ')}`);
                    }

                    const success = await setPrefixes(botJid, validPrefixes);

                    if (!success) {
                        return m.reply("『 ❌ 』 Error al guardar los prefijos en la base de datos.");
                    }

                    await m.react("⚙️");
                    return conn.sendMessage(m.chat, {
                        text: `『 ⚙︎ PREFIJOS ACTUALIZADOS 』\n\n◆ Bot ID: @${botJid.split('@')[0]}\n◆ Nuevos Prefijos: ${validPrefixes.map(p => `\`${p}\``).join(' ')}`,
                        mentions: [botJid],
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    return m.reply("『 ❌ 』 Ocurrió un error al procesar la configuración de prefijos.");
                }
            }
        },
        setcustom: {
            name: 'setcustom',
            alias: ['custom', 'personalizar'],
            admin: false,
            rowner: false,
            isPrem: false,
            self: true,
            run: async (m, { conn, text, usedPrefix }) => {
                try {
                    const botJid = cleanJid(conn.user.id);
                    const q = m.quoted ? m.quoted : m;
                    const mime = (q.msg || q).mimetype || '';

                    if (!text && !mime.includes('image')) {
                        return conn.sendMessage(m.chat, {
                            text: `『 🛠️ PERSONALIZACIÓN COMPLETA 』\n\n◆ Configura tu Bot de forma personalizada mandando los parámetros separados por "|":\n\n📌 *Formato:* ${usedPrefix}setcustom Nombre | CanalJid | URL\n\n🖼️ *Imagen:* Responde a una imagen con el comando para establecer la foto de perfil personalizada.\n\nEjemplo: ${usedPrefix}setcustom Mi Bot Pro | 120363406846602793@newsletter | https://dix.lat/mi-canal`,
                            contextInfo: { ...global.channelInfo }
                        }, { quoted: m });
                    }

                    const parts = text ? text.split('|').map(v => v.trim()) : [];
                    const customName = parts[0] || null;
                    const channelJid = parts[1] || null;
                    const customUrl = parts[2] || null;

                    let imageBuffer = null;
                    if (mime.includes('image')) {
                        imageBuffer = await q.download();
                    }

                    const result = await setCustomBotConfig(botJid, {
                        name: customName,
                        channelJid: channelJid,
                        url: customUrl,
                        imageBuffer: imageBuffer
                    });

                    if (!result.success) {
                        return m.reply("『 ❌ 』 Ocurrió un error al guardar la personalización.");
                    }

                    await m.react("✨");
                    return conn.sendMessage(m.chat, {
                        image: { url: global.img(conn) },
                        caption: `『 ✨ PERSONALIZACIÓN GUARDADA 』\n\n◆ Nombre: *${result.data.name}*\n◆ Canal JID: *${result.data.channelJid}*\n◆ URL: *${result.data.url}*\n◆ Foto Actualizada: *${result.data.hasCustomImage ? 'Sí' : 'No'}*`,
                        contextInfo: { ...global.channelInfo }
                    }, { quoted: m });

                } catch (e) {
                    console.error(e);
                    return m.reply("『 ❌ 』 Error al procesar la configuración personalizada.");
                }
            }
        }
    }
};
