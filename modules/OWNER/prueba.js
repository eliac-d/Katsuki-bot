const toBase64 = (buf) => Buffer.isBuffer(buf) ? buf.toString('base64') : Buffer.from(buf).toString('base64');

export const inspectAudioModule = {
    category: 'owner',
    commands: {
        gen: {
            name: 'gen',
            alias: ['getcode'],
            owner: true,
            run: async (m, { conn }) => {
                const q = m.quoted;
                if (!q) return conn.reply(m.chat, '❌ Responde a un mensaje', m);
                
                const msg = q.message || q.msg || {};
                const type = q.mtype || Object.keys(msg)[0];
                const c = msg[type] || q;

                const replacer = (key, value) => {
                    if (key === 'conn' || key === 'client' || key === 'store') return undefined;
                    if (value && value.type === 'Buffer' && Array.isArray(value.data)) return Buffer.from(value.data).toString('base64');
                    if (value instanceof Uint8Array) return toBase64(value);
                    if (typeof value === 'object' && value && value.low !== undefined && value.high !== undefined) return value.toNumber ? value.toNumber() : Number(value.low);
                    if (typeof value === 'function' || value === '[Circular]') return undefined;
                    return value;
                };

                let payload = {};
                
                // Si el mensaje viene estructurado con 'quotedMessage' o es un objeto completo de Baileys/IA
                if (q.message && Object.keys(q.message).length > 0) {
                    payload = q.message;
                } else if (q.msg && typeof q.msg === 'object' && q.msg !== '[Circular]') {
                    payload = { [type]: q.msg };
                } else if (type && c && typeof c === 'object') {
                    payload = { [type]: c };
                } else {
                    payload = msg;
                }

                // Limpieza de propiedades circulares usando un clon seguro con JSON.parse/stringify condicional
                let json;
                try {
                    json = JSON.stringify(payload, replacer, 2);
                } catch (err) {
                    // Fallback para estructuras muy complejas con referencias circulares profundas
                    const cache = new Set();
                    json = JSON.stringify(payload, (key, value) => {
                        if (typeof value === 'object' && value !== null) {
                            if (cache.has(value)) return '[Circular]';
                            cache.add(value);
                        }
                        return replacer(key, value);
                    }, 2);
                }

                if (json.length > 4000) {
                    await conn.sendMessage(m.chat, {
                        document: Buffer.from(json),
                        mimetype: 'application/json',
                        fileName: `raw_${type}_${Date.now()}.json`
                    }, { quoted: m });
                } else {
                    await conn.reply(m.chat, `\`\`\`json\n${json}\n\`\`\``, m);
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
