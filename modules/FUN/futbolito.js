global.futbolitoEconomy = global.futbolitoEconomy || {};
global.partidosActivos = global.partidosActivos || {};

export const futbolitoModule = {
    category: 'FUN',
    commands: {
        futbolito: {
            name: 'futbolito',
            alias: ['fut', 'partido', 'tienda'],
            desc: 'Juego de futbolito individual y multijugador con economía y tienda de mutes.',
            run: async (m, { conn, args }) => {
                const userId = m.sender;
                global.futbolitoEconomy[userId] = global.futbolitoEconomy[userId] || { balones: 150 };

                const subCmd = args[0] ? args[0].toLowerCase() : 'menu';

                if (subCmd === 'balones' || subCmd === 'cartera' || subCmd === 'saldo') {
                    const saldo = global.futbolitoEconomy[userId].balones;
                    return m.reply(
                        `⚽ *ESTADÍSTICAS DE JUGADOR*\n\n` +
                        `• *Usuario:* @${userId.split('@')[0]}\n` +
                        `• *Saldo:* ⚽ ${saldo} Balones\n\n` +
                        `_Usa \`.futbolito jugar\` para un partido rápido o \`.futbolito reto @usuario\` para retar a alguien._`,
                        null,
                        { mentions: [userId] }
                    );
                }

                if (subCmd === 'tienda' || subCmd === 'comprar') {
                    if (args[1] === 'mute') {
                        let targetJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : null);
                        
                        if (!targetJid) {
                            return m.reply('🛒 *Uso:* Responde o etiqueta al usuario con `.futbolito comprar mute @usuario` (Costo: ⚽ 400 Balones).');
                        }

                        const COSTO = 400;
                        if (global.futbolitoEconomy[userId].balones < COSTO) {
                            return m.reply(`❌ No tienes suficientes balones. Tienes ⚽ ${global.futbolitoEconomy[userId].balones} y necesitas ⚽ ${COSTO}.`);
                        }

                        global.futbolitoEconomy[userId].balones -= COSTO;
                        await conn.groupParticipantsUpdate(m.chat, [targetJid], 'remove').catch(() => null);

                        await conn.sendMessage(m.chat, {
                            text: `🤐 *SANCIÓN APLICADA*\n\n` +
                                  `• *Comprador:* @${userId.split('@')[0]}\n` +
                                  `• *Sancionado:* @${targetJid.split('@')[0]}\n` +
                                  `• *Castigo:* Expulsión temporal (Mute por 3 min)`,
                            mentions: [userId, targetJid]
                        }, { quoted: m });

                        setTimeout(async () => {
                            const code = await conn.groupInviteCode(m.chat).catch(() => null);
                            if (code) {
                                await conn.sendMessage(targetJid, { text: `⏱️ Tu sanción terminó. Puedes volver a entrar: https://chat.whatsapp.com/${code}` }).catch(() => null);
                            }
                        }, 3 * 60 * 1000);
                        return;
                    }

                    return m.reply(
                        `🏟️ *TIENDA DE FUTBOLITO*\n\n` +
                        `📦 *Artículo:* Sanción/Mute Temporal (3 min)\n` +
                        `🏷️ *Precio:* ⚽ 400 Balones\n` +
                        `👉 *Comprar:* \`.futbolito comprar mute @usuario\``
                    );
                }

                if (subCmd === 'reto' || subCmd === 'multijugador') {
                    let rivalJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid.length > 0 ? m.mentionedJid[0] : null);
                    
                    if (!rivalJid) {
                        return m.reply('⚠️ Debes etiquetar a un usuario con `@` o responder a su mensaje usando: `.futbolito reto @usuario`');
                    }

                    if (rivalJid === userId) {
                        return m.reply('⚠️ No puedes retarte a ti mismo.');
                    }

                    global.partidosActivos[m.chat] = {
                        jugador1: userId,
                        jugador2: rivalJid,
                        goles1: 0,
                        goles2: 0,
                        turno: userId,
                        fase: 'penales'
                    };

                    return conn.sendMessage(m.chat, {
                        text: `⚔️ *¡DUELO DE FUTBOLITO INICIADO!* ⚔️\n\n` +
                              `👤 *Retador:* @${userId.split('@')[0]}\n` +
                              `👤 *Rival:* @${rivalJid.split('@')[0]}\n\n` +
                              `⚽ Es turno de @${userId.split('@')[0]} para tirar a portería.\n` +
                              `Usa: \`.futbolito tirar izq\`, \`.futbolito tirar der\` o \`.futbolito tirar centro\``,
                        mentions: [userId, rivalJid]
                    }, { quoted: m });
                }

                if (subCmd === 'tirar' || subCmd === 'chutar') {
                    if (!global.partidosActivos[m.chat]) {
                        return m.reply('> No hay ningún partido multijugador activo en este chat. Inicia uno con `.futbolito reto @usuario`.');
                    }

                    const partido = global.partidosActivos[m.chat];
                    if (userId !== partido.turno) {
                        return m.reply('⏳ ¡No es tu turno de tirar!');
                    }

                    const tiro = (args[1] || '').toLowerCase();
                    const zonas = ['izq', 'der', 'centro'];
                    
                    if (!zonas.includes(tiro)) {
                        return m.reply('⚠️ Dirección inválida. Debes elegir hacia dónde tirar:\n👉 \`.futbolito tirar izq\`\n👉 \`.futbolito tirar der\`\n👉 \`.futbolito tirar centro\`.');
                    }

                    const porteriaRival = zonas[Math.floor(Math.random() * zonas.length)];
                    const esGol = tiro !== porteriaRival;

                    let textoAnimacion = 
                        `🏟️ *¡PENAL EN JUEGO!* ⚽🏃‍♂️\n\n` +
                        `💨 _El jugador toma carrera..._\n` +
                        `🎯 _¡Patea el balón hacia la zona *${tiro.toUpperCase()}*!_\n\n`;

                    if (esGol) {
                        if (userId === partido.jugador1) partido.goles1++;
                        else partido.goles2++;

                        textoAnimacion += `🎉 *¡GOOOOOOLAZO!* 🥅🔥\nEl portero se lanzó al lado contrario (${porteriaRival.toUpperCase()}).`;
                    } else {
                        textoAnimacion += `❌ *¡ATAJADÓN DEL PORTERO!* 🧤\n¡Adivinó el disparo (${porteriaRival.toUpperCase()}) y la atrapó!`;
                    }

                    textoAnimacion += `\n\n📊 *Marcador Actual:*\n` +
                                      `• @${partido.jugador1.split('@')[0]}: ${partido.goles1}\n` +
                                      `• @${partido.jugador2.split('@')[0]}: ${partido.goles2}`;

                    partido.turno = (partido.turno === partido.jugador1) ? partido.jugador2 : partido.jugador1;

                    if (partido.goles1 >= 3 || partido.goles2 >= 3) {
                        const ganador = partido.goles1 >= 3 ? partido.jugador1 : partido.jugador2;

                        global.futbolitoEconomy[ganador] = global.futbolitoEconomy[ganador] || { balones: 150 };
                        global.futbolitoEconomy[ganador].balones += 250;
                        
                        textoAnimacion += `\n\n🏆 *¡FIN DEL PARTIDO!* 🎊\nEl gran ganador del duelo es @${ganador.split('@')[0]} 🥇 (+⚽ 250 Balones).`;
                        delete global.partidosActivos[m.chat];
                        
                        return conn.sendMessage(m.chat, { text: textoAnimacion, mentions: [partido.jugador1, partido.jugador2] }, { quoted: m });
                    } else {
                        textoAnimacion += `\n\n👉 Turno ahora para: @${partido.turno.split('@')[0]} (\`.futbolito tirar izq/der/centro\`)`;
                        return conn.sendMessage(m.chat, { text: textoAnimacion, mentions: [partido.jugador1, partido.jugador2, partido.turno] }, { quoted: m });
                    }
                }

                const golBot = Math.random() < 0.55;
                const recompensa = 80;

                if (golBot) {
                    global.futbolitoEconomy[userId].balones += recompensa;
                    return m.reply(
                        `⚽🏃‍♂️ *PARTIDO SOLITARIO RÁPIDO*\n\n` +
                        `👟 Luchaste contra la defensa rival, regateaste y...\n` +
                        `🎯 *¡METISTE GOL!* 🥅✨\n\n` +
                        `• *Recompensa:* +⚽ ${recompensa} Balones\n` +
                        `• *Tu saldo:* ⚽ ${global.futbolitoEconomy[userId].balones} Balones\n\n` +
                        `_Consejo: Juega en equipo usando \`.futbolito reto @usuario\`_`
                    );
                } else {
                    return m.reply(
                        `⚽🏃‍♂️ *PARTIDO SOLITARIO RÁPIDO*\n\n` +
                        `👟 Te acercaste al área, disparaste con potencia pero...\n` +
                        `❌ *¡EL BALÓN PEGÓ EN EL PALO Y AFUERA!* 🥅💨\n\n` +
                        `No ganaste balones esta vez. ¡Inténtalo de nuevo!`
                    );
                }
            }
        }
    }
};
