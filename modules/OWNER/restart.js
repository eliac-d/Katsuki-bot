export const administrationModule = {
    category: 'owner',
    commands: {
        restart: {
            name: 'restart',
            alias: ['reiniciar', 'reboot'],
            run: async (m, { conn, isROwner }) => {
                const DEV_GROUP_JID = '120363412420888304@g.us';

                if (m.chat !== DEV_GROUP_JID) {
                    await m.react("🚫");
                    return conn.sendMessage(m.chat, { text: 'Este comando solo puede ser ejecutado en el grupo de desarrollo oficial.' }, { quoted: m });
                }

                if (!isROwner) return;

                try {
                    await m.reply(`*── 「 REINICIO DEL SISTEMA 」 ──*\n\n▢ *ESTADO:* Reiniciando servidor...\n▢ *TIEMPO:* ~2 segundos\n\n_Espere un momento por favor._`);

                    await new Promise(resolve => setTimeout(resolve, 1500));

                    console.log('┃ [RESTART] Cerrando sockets de Sub-Bots de forma limpia...');
                    global.isRestarting = true;

                    if (global.conns && global.conns instanceof Map) {
                        for (const [id, socket] of global.conns.entries()) {
                            if (id === 'main') continue;
                            try {
                                socket.ev?.removeAllListeners();
                                socket.end?.();
                            } catch (_) {}
                        }
                    }

                    try {
                        conn.ev?.removeAllListeners();
                        conn?.end?.();
                    } catch (_) {}

                    console.log('┃ [RESTART] Proceso finalizado correctamente. Reiniciando...');
                    process.exit(1);

                } catch (error) {
                    console.error(error);
                    global.isRestarting = false;
                    conn.reply(m.chat, `❌ *ERROR CRÍTICO DURANTE EL REINICIO*\n\n*LOG:* ${error.message}`, m);
                }
            }
        }
    }
};