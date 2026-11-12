import { jidNormalizedUser, getContentType, downloadContentFromMessage, generateWAMessageFromContent, prepareWAMessageMedia, generateWAMessage, jidDecode } from '@whiskeysockets/baileys';
import { getRealJid } from './identifier.js';
import fs from 'fs';
import { Buffer } from 'buffer';
import axios from 'axios';

global.getRealJid = getRealJid;
global.albumStorage = global.albumStorage || new Map();

export const smsg = async (conn, m) => {
    if (!m) return m;

    if (!conn._smsgInitialized) {
        conn._smsgInitialized = true;
        conn.generateWAMessageFromContent = generateWAMessageFromContent;
        conn.prepareWAMessageMedia = prepareWAMessageMedia;
        conn.generateWAMessage = generateWAMessage;
        conn.upload = conn.upload || conn.waUploadToServer || (async () => ({}));

        conn.downloadM = async (message, type) => {
            if (!message) return Buffer.alloc(0);
            try {
                const stream = await downloadContentFromMessage(message, type);
                const chunks = [];
                for await (const chunk of stream) chunks.push(chunk);
                return Buffer.concat(chunks);
            } catch {
                return Buffer.alloc(0);
            }
        };

        conn.getFile = async (PATH, save) => {
            let res, data;
            try {
                if (Buffer.isBuffer(PATH)) {
                    data = PATH;
                } else if (typeof PATH === 'string' && PATH.startsWith('data:')) {
                    data = Buffer.from(PATH.split(',')[1], 'base64');
                } else if (typeof PATH === 'string' && PATH.startsWith('http')) {
                    res = await axios.get(PATH, { responseType: 'stream' });
                    data = res.data;
                } else {
                    data = await fs.promises.readFile(PATH);
                }
                const mime = res?.headers?.['content-type'] || 'image/png';
                const filename = `file_${Date.now()}.${mime.split('/')[1] || 'bin'}`;
                if (save) {
                    const writer = fs.createWriteStream(filename);
                    if (data.pipe) data.pipe(writer);
                    else await fs.promises.writeFile(filename, data).catch(() => null);
                }
                return { res, filename, data, mime };
            } catch {
                return { res: null, filename: '', data: Buffer.alloc(0), mime: 'application/octet-stream' };
            }
        };

        conn.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
            try {
                const { data, mime } = await conn.getFile(path, false);
                const mtype = /webp/.test(mime) ? 'sticker' : /image/.test(mime) ? 'image' : /video/.test(mime) ? 'video' : /audio/.test(mime) ? (ptt ? 'ptt' : 'audio') : 'document';
                const content = data.pipe ? { stream: data } : data;
                return await conn.sendMessage(conn.decodeJid(jid), {
                    [mtype]: content, caption, mimetype: mime, fileName: filename,
                    contextInfo: { mentionedJid: options.mentions || conn.parseMention(caption) || [], ...options.contextInfo },
                    ...options
                }, { quoted, ...options });
            } catch {
                return null;
            }
        };

        conn.decodeJid = (jid) => {
            if (!jid) return '';
            if (typeof jid === 'object') {
                jid = jid._serialized || jid.id || (jid.user && jid.server ? `${jid.user}@${jid.server}` : '');
            }
            if (typeof jid !== 'string') return '';
            if (/:\d+@/gi.test(jid)) {
                const decode = jidDecode(jid) || {};
                return (decode?.user && decode?.server) ? `${decode.user}@${decode.server}` : jidNormalizedUser(jid);
            }
            return jidNormalizedUser(jid);
        };

        conn.profile = async (jid) => {
            const defaults = 'https://cdn.dix.lat/me/bigq_20260904-c91x-69qx-b919.jpg';
            try {
                const result = await conn.query({
                    tag: 'iq',
                    attrs: { target: jid, to: '@s.whatsapp.net', type: 'get', xmlns: 'w:profile:picture' },
                    content: [{ tag: 'picture', attrs: { type: 'image', query: 'url' } }]
                });
                const url = result?.content?.[0]?.attrs?.url;
                return url || defaults;
            } catch {
                return defaults;
            }
        };

        conn.parseMention = (text = '') => {
            if (typeof text !== 'string') return [];
            return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => `${v[1]}@s.whatsapp.net`);
        };

        conn.reply = (jid, text = '', quoted, options = {}) => {
            const cleanText = String(text).trim();
            return conn.sendMessage(conn.decodeJid(jid), { 
                text: cleanText, 
                contextInfo: { mentionedJid: conn.parseMention(cleanText), ...options.contextInfo }
            }, { quoted: quoted || m, ...options }).catch(() => null);
        };

        if (conn.groupMetadata && !conn.patchedGroupMetadata) {
            const originalGroupMetadata = conn.groupMetadata.bind(conn);
            conn.groupMetadataRaw = originalGroupMetadata;
            conn.groupMetadata = async (jid) => {
                const metadata = await originalGroupMetadata(jid).catch(() => null);
                if (metadata && Array.isArray(metadata.participants)) {
                    if (metadata.ownerPn) metadata.owner = metadata.ownerPn;
                    if (metadata.subjectOwnerPn) metadata.subjectOwner = metadata.subjectOwnerPn;

                    const processedParticipants = [];
                    const len = metadata.participants.length;
                    for (let i = 0; i < len; i++) {
                        const p = { ...metadata.participants[i] };
                        const originalId = p.id;
                        const realJid = p.phoneNumber || conn.decodeJid(originalId);
                        p.id = realJid;
                        p.phoneNumber = p.phoneNumber || realJid;
                        if (originalId?.endsWith('@lid')) p.lid = originalId;
                        processedParticipants.push(p);
                    }
                    metadata.participants = processedParticipants;
                }
                return metadata;
            };
            conn.patchedGroupMetadata = true;
        }
    }

    const cleanAlbumItems = (list) => {
        if (!Array.isArray(list)) return [];
        return list.map(item => {
            const rawMessage = item.message || (item.mtype ? { [item.mtype]: item.msg } : {});
            const mtype = item.mtype || getContentType(rawMessage || {}) || 'imageMessage';
            const msg = item.msg || rawMessage?.[mtype] || {};

            return {
                ...item,
                id: item.id || item.key?.id,
                parentId: item.parentId,
                mtype: mtype,
                msg: msg,
                message: rawMessage,
                mediaKey: !!msg?.mediaKey,
                download: () => conn.downloadM(msg, mtype.replace('Message', ''))
            };
        });
    };

    if (m.key) {
        m.id = m.key.id;
        m.isBaileys = m.id.startsWith('BAE5') || m.id.length === 16;
        m.chat = conn.decodeJid(m.key.remoteJid);
        if (typeof m.chat !== 'string') m.chat = String(m.chat || '');
        if (!m.chat) {
            console.error(`┃ [SERIALIZER] remoteJid inválido:`, JSON.stringify(m.key.remoteJid));
            return m;
        }
        m.fromMe = m.key.fromMe;
        m.isGroup = m.chat.endsWith('@g.us');
        const botId = conn.user?.id ? conn.decodeJid(conn.user.id) : '';
        m.author = conn.decodeJid(m.key.participant || m.key.remoteJid || m.participant || botId);
        m.sender = await global.getRealJid(conn, m.author, m).catch(() => m.author);

        const storedContact = conn.contacts?.[m.sender] || conn.contacts?.[m.author];
        const dbName = global.db?.data?.users?.[m.sender]?.name;
        m.pushName = m.fromMe 
            ? (conn.settings?.botName || 'bot') 
            : (m.pushName || m.verifiedName || storedContact?.name || storedContact?.notify || dbName || 'Usuario');

        m.reply = (text, chat = m.chat, options = {}) => conn.reply(conn.decodeJid(chat), text, m, options);
        m.react = (emoji) => emoji ? conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } }).catch(() => null) : undefined;
    }

    if (m.message) {
        if (m.message.ephemeralMessage) {
            m.message = m.message.ephemeralMessage.message;
        }

        m.mtype = getContentType(m.message);

        if (m.mtype === 'protocolMessage' || m.mtype === 'senderKeyDistributionMessage') return m;
        m.msg = m.message[m.mtype];
        if (!m.msg) return m;

        m.isAlbum = m.mtype === 'albumMessage' || !!m.message?.albumMessage || m.msg?.contextInfo?.quotedMessage?.albumMessage !== undefined;

        let rawText = '';
        if (m.mtype === 'interactiveResponseMessage') {
            const rawParams = m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
            if (rawParams) {
                const indexId = rawParams.indexOf('"id":"');
                if (indexId !== -1) {
                    const start = indexId + 6;
                    const end = rawParams.indexOf('"', start);
                    rawText = rawParams.slice(start, end);
                }
            }
            if (!rawText) rawText = m.message.interactiveResponseMessage?.nativeFlowResponseMessage?.name || m.msg?.body?.text || '';
        } else if (m.mtype === 'listResponseMessage') {
            rawText = m.msg.singleSelectReply?.selectedRowId || '';
        } else if (m.mtype === 'templateButtonReplyMessage') {
            rawText = m.msg.selectedId || '';
        } else {
            rawText = m.msg?.text || m.msg?.caption || m.msg?.contentText || m.message?.conversation || m.msg?.selectedDisplayText || m.msg?.title || '';
        }

        m.text = String(rawText || '').trim();
        m.download = () => conn.downloadM(m.msg, m.mtype.replace('Message', ''));

        m.parentId = m.msg?.contextInfo?.parentMessageKey?.id || m.msg?.contextInfo?.associatedChildMessageKey?.id || null;
        if (!m.parentId && (m.mtype === 'albumMessage' || !!m.message?.albumMessage)) {
            m.parentId = m.id;
        }

        m.getAlbum = () => {
            const storage = global.albumStorage;
            if (!storage) return [];
            const targetIds = [m.parentId, m.id, m.msg?.contextInfo?.stanzaId].filter(Boolean).map(String);

            for (const tId of targetIds) {
                if (storage.has(tId)) return cleanAlbumItems(storage.get(tId));
            }

            for (const [key, list] of storage.entries()) {
                if (targetIds.includes(String(key))) return cleanAlbumItems(list);
                if (Array.isArray(list) && list.some(i => targetIds.includes(String(i.id)) || targetIds.includes(String(i.parentId)))) {
                    return cleanAlbumItems(list);
                }
            }
            return [];
        };

        m.mentionedJid = m.msg?.contextInfo?.mentionedJid ? m.msg.contextInfo.mentionedJid.map(jid => conn.decodeJid(jid)) : [];

        if (m.msg?.contextInfo?.quotedMessage) {
            const botId = conn.user?.id ? conn.decodeJid(conn.user.id) : '';
            const qParticipant = conn.decodeJid(m.msg.contextInfo.participant || '');
            let qMsg = m.msg.contextInfo.quotedMessage;

            if (qMsg.ephemeralMessage) {
                qMsg = qMsg.ephemeralMessage.message;
            }

            const qStanzaId = m.msg.contextInfo.stanzaId;
            const qCtx = m.msg.contextInfo;

            let qParentId = qCtx.parentMessageKey?.id 
                || qCtx.associatedChildMessageKey?.id 
                || qCtx.quotedMessage?.messageContextInfo?.messageAssociation?.parentMessageKey?.id
                || null;

            if (!qParentId && (getContentType(qMsg) === 'albumMessage' || !!qMsg.albumMessage)) {
                qParentId = qStanzaId;
            }

            m.quoted = {
                key: { remoteJid: m.chat, fromMe: qParticipant === botId, id: qStanzaId, participant: qParticipant },
                chat: m.chat, 
                message: qMsg, 
                contextInfo: m.msg.contextInfo,
                id: qStanzaId,
                parentId: qParentId
            };

            m.quoted.mtype = getContentType(m.quoted.message);
            m.quoted.msg = m.quoted.message[m.quoted.mtype];
            m.quoted.isAlbum = m.quoted.mtype === 'albumMessage' || !!qMsg.albumMessage || !!m.msg.contextInfo.parentMessageKey;

            if (m.quoted.msg) {
                m.quoted.text = String(m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.contentText || m.quoted.message?.conversation || '').trim();
                m.quoted.sender = await global.getRealJid(conn, qParticipant, { ...m.quoted, chat: m.chat }).catch(() => qParticipant);

                const quotedContact = conn.contacts?.[m.quoted.sender] || conn.contacts?.[qParticipant];
                const quotedDbName = global.db?.data?.users?.[m.quoted.sender]?.name;

                m.quoted.pushName = m.quoted.key.fromMe 
                    ? (conn.settings?.botName || 'bot')
                    : (quotedContact?.name || quotedContact?.notify || quotedDbName || (m.quoted.sender === m.sender ? m.pushName : 'Usuario'));

                m.quoted.download = () => conn.downloadM(m.quoted.msg, m.quoted.mtype.replace('Message', ''));

                m.quoted.getAlbum = () => {
                    const storage = global.albumStorage;
                    if (!storage) return [];

                    const targetIds = [m.quoted.parentId, m.quoted.id, m.msg?.contextInfo?.stanzaId].filter(Boolean).map(String);

                    for (const tId of targetIds) {
                        if (storage.has(tId)) return cleanAlbumItems(storage.get(tId));
                    }

                    for (const [key, list] of storage.entries()) {
                        if (targetIds.includes(String(key))) return cleanAlbumItems(list);
                        if (Array.isArray(list) && list.some(i => targetIds.includes(String(i.id)) || targetIds.includes(String(i.parentId)))) {
                            return cleanAlbumItems(list);
                        }
                    }
                    return [];
                };
            }
        } else {
            m.quoted = null;
        }
    }
    return m;
};