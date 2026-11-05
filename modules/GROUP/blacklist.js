function extraerJidCrudo(m, args) {
    if (m.mentionedJid && m.mentionedJid.length > 0) return m.mentionedJid[0];
    if (m.quoted && m.quoted.sender) return m.quoted.sender;
    if (args[0]) return `${args[0].replace(/[^0-9]/g, '')}@s.whatsapp.net`;
    return null;
}

function extraerNumero(m, args) {
    const jid = extraerJidCrudo(m, args);
    return jid ? jid.split('@')[0].replace(/\D/g, '') : null;
}

async function getRealJid(conn, jid, m) {
    return jid;
}

export const BlacklistGroupModule = {
    category: 'group',
    commands: {
        1: {
            name: 'black',
            alias: ['blacklist', 'ban'],
            owner: true,
            run: async function (m, { conn, args }) {
                const jidCrudo = extraerJidCrudo(m, args);
                const numero = extraerNumero(m, args);

                if (!jidCrudo || !numero) {
                    return m.reply(
                        `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                        `*» ALERTA* : Menciona a un usuario, responde su mensaje o escribe el número.\n\n` +
                        `• *Ejemplo* : \`.black @usuario motivo\``
                    );
                }

                const realJid = await getRealJid(conn, jidCrudo, m).catch(() => jidCrudo);

                let rawText = args.join(' ');
                if (m.mentionedJid && m.mentionedJid.length > 0) {
                    m.mentionedJid.forEach(jid => {
                        const num = jid.split('@')[0];
                        rawText = rawText.replace(new RegExp(`@?${num}`, 'g'), '');
                    });
                } else if (args[0] && args[0].replace(/\D/g, '') === numero) {
                    rawText = args.slice(1).join(' ');
                }
                const motivo = rawText.trim() || 'Sin motivo especificado';

                const existente = await global.User.findOne({
                    $or: [{ id: realJid }, { lid: realJid }]
                }).catch(() => null);

                if (existente?.banned) {
                    return m.reply(
                        `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                        `*» ALERTA* : El usuario *@${numero}* ya está registrado en la blacklist.`
                    );
                }

                await global.User.findOneAndUpdate(
                    { $or: [{ id: realJid }, { lid: realJid }] },
                    { $set: { id: realJid, banned: true, banReason: motivo } },
                    { upsert: true }
                );

                if (global.userCache) global.userCache.delete(realJid);

                const grupos = await conn.groupFetchAllParticipating().catch(() => ({}));
                const gruposArray = Object.values(grupos || {});
                const botNumero = conn.user?.id?.split(':')[0].replace(/\D/g, '');

                let expulsado = 0;
                let fallido = 0;

                for (const grupo of gruposArray) {
                    const objetivo = grupo.participants.find(p => {
                        const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
                        return pNum === numero;
                    });
                    if (!objetivo) continue;

                    const botParticipant = grupo.participants.find(p => {
                        const pNum = p.phoneNumber ? p.phoneNumber.replace(/\D/g, '') : p.id.split('@')[0].replace(/\D/g, '');
                        return pNum === botNumero;
                    });
                    const botEsAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin' || botParticipant.isAdmin || botParticipant.isSuperAdmin);

                    if (!botEsAdmin) {
                        fallido++;
                        continue;
                    }

                    try {
                        await conn.groupParticipantsUpdate(grupo.id, [objetivo.id], 'remove');
                        expulsado++;
                    } catch {
                        fallido++;
                    }
                }

                let reporte = `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n`;
                reporte += `*» USUARIO AGREGADO A LA BLACKLIST «*\n\n`;
                reporte += `• *Usuario* : @${numero}\n`;
                reporte += `• *Motivo* : ${motivo}\n`;
                reporte += `• *Expulsado de* : ${expulsado} grupo(s)\n`;
                if (fallido > 0) reporte += `• *Sin expulsar* : ${fallido} grupo(s) (Falta admin)\n`;
                reporte += `\n_El usuario ha sido bloqueado del sistema._`;

                return m.reply(reporte, null, { mentions: [realJid] });
            }
        },
        2: {
            name: 'unblack',
            alias: ['unblacklist', 'unban'],
            owner: true,
            run: async function (m, { conn, args }) {
                const jidCrudo = extraerJidCrudo(m, args);
                const numero = extraerNumero(m, args);

                if (!jidCrudo || !numero) {
                    return m.reply(
                        `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                        `*» ALERTA* : Menciona a un usuario, responde su mensaje o escribe el número.\n\n` +
                        `• *Ejemplo* : \`.unblack @usuario\``
                    );
                }

                const realJid = await getRealJid(conn, jidCrudo, m).catch(() => jidCrudo);

                const resultado = await global.User.findOneAndUpdate(
                    { $or: [{ id: realJid }, { lid: realJid }], banned: true },
                    { $set: { banned: false, banReason: null } }
                );

                if (!resultado) {
                    return m.reply(
                        `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                        `*» ALERTA* : El usuario *@${numero}* no se encuentra en la blacklist.`
                    );
                }

                if (global.userCache) global.userCache.delete(realJid);

                return m.reply(
                    `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                    `*» BLACKLIST ACTUALIZADA «*\n\n` +
                    `• *Usuario* : @${numero}\n` +
                    `• *Estado* : Removido de la lista negra correctamente.`
                );
            }
        },
        3: {
            name: 'listblack',
            alias: ['blacklisted'],
            owner: true,
            run: async function (m) {
                const lista = await global.User.find({ banned: true }).lean().catch(() => []);

                if (!lista || lista.length === 0) {
                    return m.reply(
                        `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                        `*» REGISTRO VACÍO «*\n\n` +
                        `• No hay usuarios registrados en la blacklist actualmente.`
                    );
                }

                const texto = lista
                    .map((item, i) => `• *${i + 1}.* @${item.id.split('@')[0]} — ${item.banReason || 'Sin motivo'}`)
                    .join('\n');

                return m.reply(
                    `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                    `*» LISTA NEGRA DE USUARIOS (${lista.length}) «*\n\n${texto}`
                );
            }
        }
    }
};
