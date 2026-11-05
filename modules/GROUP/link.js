import axios from 'axios';
import fetch from 'node-fetch';

const getBotName = (conn) => (typeof name === 'function' ? name(conn) : (conn?.user?.name || 'Bot'));
const getBotImg = (conn) => (typeof img === 'function' ? img(conn) : null);
const getDeveloperName = () => (typeof developer !== 'undefined' ? developer : 'Developer');

export const linkCommand = {
    category: 'group',
    commands: {
        link: {
            name: 'link',
            alias: ['enlace', 'link'],
            group: true,
            botAdmin: true,
            run: async (m, { conn }) => {
                try {
                    const groupMetadata = await conn.groupMetadata(m.chat);
                    const inviteCode = await conn.groupInviteCode(m.chat);
                    const mainLink = `https://chat.whatsapp.com/${inviteCode}`;

                    let shortLink;
                    try {
                        const { data } = await axios.post('https://dix.lat/v1/short?', {
                            url: mainLink
                        }, {
                            headers: { 'Content-Type': 'application/json' }
                        });

                        shortLink = data.status ? data.url : 'No disponible';
                    } catch (error) {
                        console.error('Error al acortar:', error);
                        shortLink = 'Error en el servicio';
                    }

                    const txt = `*─── 「 ENLACE DE GRUPO 」 ───*\n\n▢ *GRUPO:* ${groupMetadata.subject}\n▢ *MIEMBROS:* ${groupMetadata.participants.length}\n\n▢ *ENLACE PRINCIPAL:*\n• ${mainLink}\n\n▢ *ENLACE CORTO:*\n• ${shortLink}\n\n*──────────────────────────*`.trim();

                    const usuariosActivos = groupMetadata.participants;
                    const topMiembros = groupMetadata.participants;

                    return await conn.sendMessage(m.chat, {
                        product: {
                            productImage: {
                                url: img(conn)
                            },
                            title: name(conn),                            description: `Miembros activos: ${usuariosActivos.length}`,
                            retailerId: "1466", 
                            productId: "37199733896340479", 
                            productImageCount: 1,
                        },
                        businessOwnerJid: "50432955554@s.whatsapp.net",
                        footer: txt.trim()
                    }, { messageType: 'product', quoted: m });
                } catch (e) {
                    console.error('Error en el comando link:', e);
                }
            }
        }
    }
};
