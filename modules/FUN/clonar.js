import { delay } from '@whiskeysockets/baileys';

export const fakeMsgCommands = {
    category: 'owner',
    commands: {
        fakemsg: {
            name: 'fakemsg',
            alias: ['fakemsg'],
            owner: true,
            group: true,
            run: async (m, { conn, text }) => {
                if (!m.quoted) {
                    return conn.sendMessage(m.chat, { text: 'Reply pesan yang ingin diproses.' }, { quoted: m });
                }

                if (!text) {
                    return conn.sendMessage(m.chat, { text: 'Masukkan teks pengganti.' }, { quoted: m });
                }

                const stanzaId = m.quoted.key.id; //target stanza

                try {
                    const tempId = await conn.relayMessage(
                        m.chat,
                        {
                            extendedTextMessage: {
                                text: '',
                                contextInfo: {
                                    isGroupStatus: true,
                                },
                            },
                        },
                        {}
                    );

                    const tempId2 = await conn.relayMessage(
                        m.chat,
                        {
                            protocolMessage: {
                                key: {
                                    jid: m.chat,
                                    fromMe: true,
                                    id: tempId,
                                },
                                type: 14,
                                editedMessage: {
                                    extendedTextMessage: {
                                        text,
                                        contextInfo: {
                                            isGroupStatus: false,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            messageId: stanzaId,
                        }
                    );

                    await delay(100);

                    await Promise.allSettled([
                        conn.sendMessage(m.chat, {
                            delete: {
                                remoteJid: m.chat,
                                id: tempId,
                                fromMe: true,
                            },
                        }),
                        conn.sendMessage(m.chat, {
                            delete: {
                                remoteJid: m.chat,
                                id: tempId2,
                                fromMe: true,
                            },
                        }),
                    ]);
                } catch (e) {
                    console.error('[fakemsg]', e);
                    await conn.sendMessage(m.chat, { text: 'Error: ' + (e?.message || e) }, { quoted: m });
                }
            }
        }
    }
};
