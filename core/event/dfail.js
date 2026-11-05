export const dfail = async (type, m, conn) => {
    const messages = {
        rowner: `> « Ni se te ocurra. Solo mi creador tiene autoridad para ordenar esto. »`,
        owner: `> « Ni se te ocurra. Solo mi creador tiene autoridad para ordenar esto. »`,
        group: `> « Ubícate. Esta función solo se ejecuta en chats grupales. »`,
        private: `> « Cosas serias en privado. Hazlo en el chat directo. »`,
        admin: `> « No tienes el rango suficiente. Esto es solo para administradores. »`,
        nsfw: `> « Compórtate. El módulo NSFW está completamente desactivado aquí. »`,
        botAdmin: `> « Dame permisos de administración si quieres que haga mi trabajo. »`,
        self: `> « Apártate. Esta instrucción es exclusiva para el host de la cuenta. »`,
        isPrem: `> « No tienes el nivel. Esta función requiere suscripción Premium. »`
    };

    if (messages[type] && m.chat) {
        await conn.sendPreviewMessage(m.chat, messages[type], {
            type: 3, 
            ratio: 'landscape',
            url: global.surl(conn),
            thumbnail: img(conn),
            title: name(conn),
            body: global.developer,
            quoted: m,
            contextInfo: {
                ...global.channelInfo
            }
        }).catch(() => null);
    }
};
