import { downloadMediaMessage } from '@whiskeysockets/baileys';

export const ptvCommand = {
    category: 'tools',
    commands: {
        ptv: {
            name: 'ptv',
            alias: ['videonota', 'notadevideo'],
            run: async (m, { conn }) => {
                const quoted = m.quoted ? m.quoted : m;
                const mime = (quoted.msg || quoted).mimetype || '';

                if (!/video/.test(mime)) {
                    return await conn.sendMessage(m.chat, { 
                        text: '❌ Responde a un video o adjunta uno para convertirlo en nota de video (PTV).' 
                    }, { quoted: m });
                }

                const media = await downloadMediaMessage(quoted, 'buffer', {});

                await conn.sendMessage(
                    m.chat,
                    {
                        video: media,
                        ptv: true,
                        mimetype: 'video/mp4',
                        contextInfo: {
                            isForwarded: true,
                            forwardingScore: 999,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363406846602793@newsletter',
                                newsletterServerId: 100,
                                newsletterName: name(conn)
                            }
                        }
                    },
                    {
                        quoted: {
                            key: {
                                remoteJid: m.chat,
                                fromMe: false,
                                id: 'A59B994B0AA8DC32D6ABC580A151A811',
                                participant: '50432955554@s.whatsapp.net'
                            },
                            message: {
                                extendedTextMessage: {
                                    text: "hola",
                                    contextInfo: {
                                        isForwarded: true,
                                        forwardingScore: 999,
                                        forwardedNewsletterMessageInfo: {
                                            newsletterJid: '120363406846602793@newsletter',
                                            newsletterServerId: 100,
                                            newsletterName: 'Canal Oficial'
                                        },
                                        mentionedJid: [
                                            "50432955554@s.whatsapp.net"
                                        ],
                                        participant: "50432955554@s.whatsapp.net",
                                        stanzaId: "A59B994B0AA8DC32D6ABC580A151A811",
                                        quotedMessage: {
                                            contactMessage: {
                                                displayName: "Deylin Eliac 🎧",
                                                vcard: "BEGIN:VCARD\nVERSION:3.0\nN:;;;;\nFN:Deylin Eliac 🎧\nitem1.TEL;waid=50432955554:+504 3295-5554\nitem1.X-ABLabel:Celular\nPHOTO;BASE64:/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                );
            }
        }
    }
};
