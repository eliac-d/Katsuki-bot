import fs from 'fs';
import path from 'path';
import { jidNormalizedUser } from '@whiskeysockets/baileys';
import { startSubBot, getSubBotCount, registerPairingMessage } from '../../core/s/serbot-bridge.js';

const DB_PATH = path.resolve('database/local_db.json');

let memoryDb = null;

function getDb() {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        if (!fs.existsSync(DB_PATH)) {
            const initialData = { maxSubbots: 20 };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
            memoryDb = initialData;
            return initialData;
        }
        const data = fs.readFileSync(DB_PATH, 'utf-8').trim();
        if (!data || data === '{}') {
            const initialData = memoryDb || { maxSubbots: 3 };
            fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
            memoryDb = initialData;
            return initialData;
        }
        const parsed = JSON.parse(data);
        if (typeof parsed.maxSubbots !== 'number') {
            parsed.maxSubbots = memoryDb?.maxSubbots ?? 3;
            fs.writeFileSync(DB_PATH, JSON.stringify(parsed, null, 2), 'utf-8');
        }
        memoryDb = parsed;
        return parsed;
    } catch (err) {
        console.error("Error al leer la base de datos local, usando respaldo en memoria:", err);
        if (memoryDb) {
            return memoryDb;
        }
        return { maxSubbots: 3 };
    }
}

function saveDb(data) {
    try {
        const dir = path.dirname(DB_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
        memoryDb = data;
    } catch (err) {
        console.error("Error al guardar en la base de datos local:", err);
    }
}

export const serbotCommand = {
    category: 'subbots',
    commands: {
        serbot: {
            name: 'serbot',
            alias: ['code'],
            run: async (m, { conn, args, usedPrefix, command }) => {
                try {
                    await m.react('⏳');
                    const i = global.img(conn);

                    global.serbotCooldown = global.serbotCooldown || {};
                    const senderId = m.sender ? jidNormalizedUser(m.sender) : '';
                    if (!senderId) return;

                    const tiempoActual = Date.now();
                    const tiempoEspera = 1 * 60 * 1000;

                    if (global.serbotCooldown[senderId] && (tiempoActual - global.serbotCooldown[senderId] < tiempoEspera)) {
                        const minutosRestantes = Math.ceil((tiempoEspera - (tiempoActual - global.serbotCooldown[senderId])) / (60 * 1000));
                        await m.react('❌');
                        return await m.reply(`⚠ *ESPERA DEMASIADO RÁPIDO*\n\nYa has solicitado un emparejamiento recientemente. Por favor, espera *${minutosRestantes} minuto(s)* antes de volver a usar el comando para no saturar el servidor.`);
                    }

                    const db = getDb();
                    const MAX_SUBBOTS = db.maxSubbots;
                    const activeCount = await getSubBotCount();

                    if (activeCount >= MAX_SUBBOTS) {
                        const botones = [
                            { text: 'Donar', url: 'https://www.dynlayer.xyz/' }
                        ];
                        const opciones = {
                            title: "亗  CAPACIDAD LLENA  亗",
                            footer: developer,
                            quoted: m,
                            image: i
                        };
                        await m.react('❌');
                        return await conn.sendButtonMessage(m.chat, `No hay espacios disponibles para más subbots.

Puedes apoyar realizando una donación o contribución voluntaria para ayudarnos a aumentar la capacidad del servidor y activar más subbots. ¡Cualquier aporte nos ayuda a mantener el servicio activo!
`, botones, opciones);
                    }

                    let hasUsername = false;
                    let usernameVal = m.username || m.user?.username;

                    if (m.isGroup) {
                        try {
                            const groupMetadata = await conn.groupMetadata(m.chat);
                            const participant = groupMetadata?.participants?.find(p => p.id === m.sender || p.lid === m.sender);
                            if (participant?.username) {
                                hasUsername = true;
                                usernameVal = participant.username;
                            }
                        } catch (e) {
                            console.error("Error al obtener metadata del grupo:", e);
                        }
                    }

                    const isLid = senderId.endsWith('@lid') || m.sender?.endsWith('@lid');

                    if (!args[0] && (hasUsername || isLid || usernameVal)) {
                        await m.react('❌');


                return await global.sendNewsletterAdminInvite({
    chat: m.chat,
    conn: conn,
    newsletterName: name(conn),
    imageUrl: global.img(conn),
    caption: `Hola. Debido a la configuración de privacidad de tu nombre de usuario, no fue posible obtener tu número de teléfono automáticamente.\n\nPara solucionar esto, tienes dos opciones:\n\n1. Usa el comando *code* seguido de tu número manualmente (asegúrate de incluir el código de país correctamente).\n2. O bien, desactiva temporalmente tu nombre de usuario en los ajustes de tu perfil e intenta de nuevo.`,
    expiration: true,
    quoted: m
});

}

                    let targetNum = args[0] ? args[0].replace(/[^0-9]/g, '') : (senderId.split('@')[0] || '');
                    if (!targetNum || targetNum.length < 8) {
                        await m.react('❌');
                        return await m.reply('⚠ Número inválido. Usa el comando sin argumentos para tu número o escribe el número completo con código de país.');
                    }

                    let code;
                    try {
                        code = await startSubBot(m, conn, targetNum, { isCode: true });
                    } catch (startErr) {
                        await m.react('❌');
                        const msg = startErr?.message || String(startErr);
                        if (msg.includes('ya está vinculado')) {
                            return await m.reply(`✅ Ese número ya está vinculado y conectado. No hace falta pedir un código nuevo.`);
                        }
                        return await m.reply(`⚠ Error al iniciar el sub-bot:\n\n${msg}`);
                    }

                    if (code && typeof code === 'string') {
                        global.serbotCooldown[senderId] = tiempoActual;

                        const instructions = `亗  *${name(conn)}* 亗\n\n༂ꦽ  ① DISPOSITIVOS VINCULADOS\n༂ꦽ  ② VINCULAR CON NÚMERO\n༂ꦽ  ③ INGRESAR EL CÓDIGO\n\n✰ *SOLICITUD:* @${targetNum}\n✰ *CAPACIDAD:* ${activeCount}/${MAX_SUBBOTS}\n\nTu código de vinculación es: *${code}*`;

                        const botonesUnificados = [
                            { text: 'Copiar Código', copy: code },
                            { text: 'Términos', id: `${usedPrefix}terminos` },
                            { text: 'Subbots', webview: 'https://dix.lat/katsuki' }
                        ];

                        const opcionesUnificadas = {
                            title: "VINCULACIÓN DE SUB-BOT",
                            footer: name(conn),
                            quoted: m,
                            image: i
                        };
                        await m.react('✅');

                        const sentMsg = await conn.sendButtonMessage(m.chat, instructions, botonesUnificados, opcionesUnificadas);
                        if (sentMsg?.key) {
                            registerPairingMessage(targetNum, m.chat, sentMsg.key);
                        }
                    } else {
                        await m.react('❌');
                        await m.reply(`⚠ No se pudo obtener el código de vinculación (Respuesta vacía o inválida).`);
                    }
                } catch (err) {
                    console.error(err);
                    await m.react('❌');
                    await m.reply("Error en la ejecución del comando serbot:\n\n" + err.message);
                }
            }
        },
        setmaxsubbots: {
            name: 'setmaxsubbots',
            alias: ['setmaxbot', 'setmaxbots'],
            run: async (m, { args, usedPrefix, command, isROwner }) => {
                try {
                    if (!isROwner) return;

                    if (!args[0] || isNaN(args[0])) {
                        await m.react('❌');
                        return await m.reply(`⚠ Uso incorrecto del comando.\n\n*Ejemplo:* ${usedPrefix}${command} 5`);
                    }

                    const newLimit = parseInt(args[0], 10);
                    if (newLimit < 0) {
                        await m.react('❌');
                        return await m.reply('⚠ La cantidad de subbots debe ser un número igual o mayor a 0.');
                    }

                    const db = getDb();
                    const oldLimit = db.maxSubbots;
                    db.maxSubbots = newLimit;
                    saveDb(db);

                    await m.react('✅');
                    return await m.reply(`✅ *LÍMITE DE SUBBOTS ACTUALIZADO*\n\n• *Anterior:* ${oldLimit}\n• *Nuevo Límite:* ${newLimit}\n• *Guardado en:* database/local_db.json`);
                } catch (err) {
                    console.error(err);
                    await m.react('❌');
                    await m.reply("Error en la ejecución del comando setmaxsubbots:\n\n" + err.message);
                }
            }
        }
    }
};