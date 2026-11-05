

const toBase64 = (buf) => Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64');

export const inspectAudioModule = {
    category: 'owner',
    commands: {
        gen: {
            name: 'genm',
            alias: ['getquoted'],
           
            run: async (m, { conn }) => {
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde a un mensaje', m);

                const replacer = (key, value) => {
                    if (value && value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data).toString('base64');
                    if (value instanceof Uint8Array) return toBase64(value);
                    if (typeof value === 'object' && value && value.low !== undefined && value.high !== undefined) return value.toNumber ? value.toNumber() : Number(value.low);
                    return value;
                };

                const msg = q.message || q.msg || {};
                const type = q.mtype || Object.keys(msg)[0];
                const content = msg[type] || msg;

                // Extraer únicamente el objeto quotedMessage
                const quotedMessageData = msg.contextInfo?.quotedMessage || (type ? { [type]: content } : msg);
                const senderJid = q.sender || m.sender;
                const senderNumber = senderJid.split('@')[0];

                const payload = {
                    extendedTextMessage: {
                        text: "hola",
                        contextInfo: {
                            mentionedJid: q.mentionedJid || msg.contextInfo?.mentionedJid || [senderJid],
                            participant: senderJid,
                            stanzaId: q.id || msg.contextInfo?.stanzaId || m.key.id,
                            quotedMessage: quotedMessageData
                        }
                    }
                };

                const codeOutput = `=> await conn.relayMessage(\n  m.chat,\n  ${JSON.stringify(payload, replacer, 2)},\n  {\n    additionalAttributes: {\n      type: "text"\n    }\n  }\n);`;

                if (codeOutput.length > 4000) {
                    await conn.sendMessage(m.chat, {
                        document: Buffer.from(codeOutput),
                        mimetype: 'application/javascript',
                        fileName: `relay_${type}_${Date.now()}.js`
                    }, { quoted: m });
                } else {
                    await conn.reply(m.chat, codeOutput, m);
                }
            }
        },
        run: {
            name: 'run',
            alias: ['ejecutar'],
            owner: true,
            run: async (m, { conn }) => {
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde al JSON', m);

                try {
                    let txt = '';

                    if (q.mtype === 'documentMessage') {
                        const buffer = q.download ? await q.download() : await conn.downloadMediaMessage(q);
                        txt = buffer.toString('utf-8');
                    } else {
                        txt = q.text || q.msg?.caption || '';
                        txt = txt.replace(/```json/g, '').replace(/```/g, '').trim();
                    }

                    const raw = JSON.parse(txt);
                    const rootType = Object.keys(raw)[0] || 'Desconocido';

                    const innerKeys = raw[rootType] && typeof raw[rootType] === 'object' 
                        ? Object.keys(raw[rootType]).join(', ') 
                        : 'Sin campos internos';

                    const messageId = await conn.relayMessage(m.chat, raw, {});

                    const infoText = `> *✎ Mensaje procesado correctamente*\n\n` +
                        `*• Estructura Raíz:* \`${rootType}\`\n` +
                        `*• Campos Internos:* \`${innerKeys}\`\n` +
                        `*• ID de Mensaje:* \`${messageId || 'N/A'}\``;

                    await conn.reply(m.chat, infoText, m);
                } catch (e) {
                    await conn.reply(m.chat, `❌ Error: ${e.message}`, m);
                }
            }
        }
    }
};