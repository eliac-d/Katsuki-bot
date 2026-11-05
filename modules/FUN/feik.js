import crypto from 'crypto';

export const verdadDetectorModule = {
    category: 'fun',
    commands: {
        verdad: {
            name: 'verdad',
            alias: ['detector', 'feik', 'detectordeverdad'],
            run: async (m, { conn, text, usedPrefix, command }) => {
                try {
                    const targetText = text || (m.quoted ? m.quoted.text : null);

                    if (!targetText) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} <texto> o responde a un mensaje.`);
                    }

                    await m.react('🔍');

                    const hash = crypto.createHash('md5').update(targetText.toLowerCase().trim()).digest('hex');
                    const verdadPorcentaje = parseInt(hash.substring(0, 8), 16) % 101;
                    const mentiraPorcentaje = 100 - verdadPorcentaje;

                    const senderNumber = m.sender.split('@')[0];
                    const fakeStanzaId = crypto.randomBytes(16).toString('hex').toUpperCase();

                    const quotedContent = m.quoted ? {
                        extendedTextMessage: {
                            text: m.quoted.text || 'Mensaje multimedia'
                        }
                    } : {
                        extendedTextMessage: {
                            text: targetText
                        }
                    };

                    const targetParticipant = m.quoted ? m.quoted.sender : m.sender;

                    await conn.relayMessage(
                        m.chat,
                        {
                            pollResultSnapshotMessage: {
                                name: `@${senderNumber}`,
                                pollVotes: [
                                    {
                                        optionName: `Verdad (${verdadPorcentaje}%) 🟢`,
                                        optionVoteCount: `${verdadPorcentaje}`
                                    },
                                    {
                                        optionName: `Mentira (${mentiraPorcentaje}%) 🔴`,
                                        optionVoteCount: `${mentiraPorcentaje}`
                                    }
                                ],
                                pollType: "POLL",
                                contextInfo: {
                                    mentionedJid: [m.sender],
                                    participant: targetParticipant,
                                    stanzaId: fakeStanzaId,
                                    quotedMessage: quotedContent
                                }
                            }
                        },
                        {
                            additionalAttributes: {
                                type: "text"
                            }
                        }
                    );

                    await m.react('✅');

                } catch (error) {
                    console.error('Error en el detector de verdad:', error);
                    await m.react('❌');
                    m.reply(`> Error al procesar la solicitud: ${error.message}`);
                }
            }
        }
    }
};
