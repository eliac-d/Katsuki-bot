export const avisoModule = {
    category: 'group',
    commands: {
        aviso: {
            name: 'aviso',
            alias: ['comunicado', 'advertencia'],
            desc: 'Envía un comunicado formal con metadatos y referencia de chat a un número específico.',
            run: async (m, { conn, args, isOwner, isAdmin }) => {
                const senderNumber = m.sender.replace(/[^0-9]/g, '');
                const ownerList = global.owner || [];
                const checkOwner = isOwner || m.fromMe || ownerList.some(owner => owner.includes(senderNumber));
                const checkAdmin = m.isGroup && isAdmin;

                if (!checkOwner && !checkAdmin) {
                    return m.reply('Este comando solo puede ser usado por administradores o el creador del bot.');
                }

                const targetInput = args[0];
                const messageContent = args.slice(1).join(' ').trim();

                if (!targetInput || !messageContent) {
                    return m.reply('Uso incorrecto.\nFormato: .aviso [número] [mensaje]\nEjemplo: .aviso 521234567890 Hola juan');
                }

                const cleanNumber = targetInput.replace(/[^0-9]/g, '');
                const targetJid = `${cleanNumber}@s.whatsapp.net`;
                const senderJid = m.sender;

                const now = new Date();
                const hora = now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                const fecha = now.toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' });
                const dia = now.toLocaleDateString('es-ES', { weekday: 'long' });

                const messageId = `MSG-${Math.floor(10000 + Math.random() * 90000)}`;
                const chatId = m.chat.split('@')[0];

                const formattedText = 
                    `*AVISO / COMUNICADO OFICIAL*\n\n` +
                    `Hola, ${messageContent}\n\n` +
                    `• *Remitente* : @${senderJid.split('@')[0]}\n` +
                    `• *Destinatario* : @${targetJid.split('@')[0]}\n` +
                    `• *Hora* : ${hora}\n` +
                    `• *Día* : ${dia}\n` +
                    `• *Fecha* : ${fecha}\n` +
                    `• *Identificador* : ${messageId}\n\n` +
                    `chat:${chatId} '${messageContent}' enviado por @${senderJid.split('@')[0]}`;

                try {
                    await conn.sendMessage(targetJid, {
                        text: formattedText,
                        mentions: [senderJid, targetJid]
                    });

                    return m.reply(`Comunicado enviado correctamente.\nIdentificador: *${messageId}*`);
                } catch (err) {
                    console.error("Error detallado al enviar comunicado:", err);
                    return m.reply(`No se pudo enviar el mensaje.\nError: ${err.message || 'Desconocido'}`);
                }
            }
        }
    }
};
