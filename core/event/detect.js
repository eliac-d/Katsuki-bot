import { jidNormalizedUser } from '@whiskeysockets/baileys';

export async function observeEvents(conn) {
    if (!conn) return;

    conn.ev.on('group-participants.update', async (m) => {
        try {
            const chatJid = m.id || m.chat;
            if (!chatJid?.endsWith('@g.us')) return;

            if (!global.Chat || typeof global.Chat.findOne !== 'function') return;
            const chat = await global.Chat.findOne({ id: chatJid });

            if (!chat || chat.isBanned) return;

            const botJid = jidNormalizedUser(conn.user?.id || '');
            const isMainBot = botJid === jidNormalizedUser(global.conn?.user?.id || '');

            if (chat.antisub && !isMainBot) return;

            let groupMetadata = global.groupCache?.get(chatJid);
            if (!groupMetadata) {
                groupMetadata = await conn.groupMetadata(chatJid).catch(() => ({}));
                if (groupMetadata && global.groupCache) {
                    global.groupCache.set(chatJid, groupMetadata);
                }
            }

            const groupName = groupMetadata.subject || 'Sistema';
            const memberCount = groupMetadata.participants?.length || 0;
            const groupDesc = groupMetadata.desc || 'Sin descripción';
            const defaultImage = (typeof global.img === 'function' ? global.img(conn) : global.img);

            const getRealJid = (part) => {
                if (!part) return '';
                if (typeof part === 'string') {
                    if (part.includes('@s.whatsapp.net') || part.includes('@lid')) return part;
                    return `${part.split('@')[0]}@s.whatsapp.net`;
                }
                const raw = part.phoneNumber || part.id || '';
                if (!raw) return '';
                if (raw.includes('@s.whatsapp.net') || raw.includes('@lid')) return raw;
                return `${raw.split('@')[0]}@s.whatsapp.net`;
            };

            const authorJid = getRealJid(m.author || m.by);
            const authorTag = authorJid ? `@${authorJid.split('@')[0]}` : 'Un Administrador';

            if (m.action === 'add' && chat.welcome) {
                await Promise.all(
                    m.participants.map(async (part) => {
                        const userJid = getRealJid(part);
                        if (!userJid) return;

                        const whoTag = `@${userJid.split('@')[0]}`;
                        let txt = '';

                        if (chat.customWelcome) {
                            txt = chat.customWelcome
                                .replace(/@us/g, whoTag)
                                .replace(/@g/g, groupName)
                                .replace(/@t/g, memberCount)
                                .replace(/@d/g, groupDesc)
                                .replace(/@n/g, groupName.toUpperCase())
                                .replace(/@by/g, authorTag);
                        } else {
                            txt = `╭──────────────┄\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ɴᴏᴅᴇ: ${groupName}\n│〉 ᴀɢʀᴇɢᴀᴅᴏ ᴘᴏʀ: ${authorTag}\n│〉 ꜱᴛᴀᴛᴜꜱ: ᴏɴʟɪɴᴇ\n┝──────────────┄\n┝➠  ᴅᴀᴛᴀ\n│ ɴᴏᴅᴏꜱ: [ ${memberCount} ]\n╰─────────────┄\n\n`;
                        }

                        const botonesWelcome = [
                            { text: 'HOLA SIGUE NUESTRO CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }, { text: 'VER MENÚ', id: '.menu' }
                        ];

                        const mentions = [userJid];
                        if (authorJid) mentions.push(authorJid);

                        const opcionesWelcome = {
                            title: groupName,
                            footer: global.developer,
                            image: typeof defaultImage === 'string' && defaultImage.startsWith('http') ? { url: defaultImage } : (Buffer.isBuffer(defaultImage) ? defaultImage : { url: defaultImage }),
                            mentions
                        };

                        await conn.sendButtonMessage(chatJid, txt, botonesWelcome, opcionesWelcome).catch(() => null);
                    })
                );
            }

            if (m.action === 'remove' && chat.welcome) {
                await Promise.all(
                    m.participants.map(async (part) => {
                        const userJid = getRealJid(part);
                        if (!userJid) return;

                        const whoTag = `@${userJid.split('@')[0]}`;
                        let txt = `╭──────────────┄\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ꜱᴀᴄᴀᴅᴏ / ꜱᴀʟɪᴏ ᴅᴇ: ${groupName}\n│〉 ᴀᴄᴄɪᴏ́ɴ ᴘᴏʀ: ${authorTag}\n│〉 ꜱᴛᴀᴛᴜꜱ: ᴏꜰꜰʟɪɴᴇ\n┝──────────────┄\n┝➠  ᴅᴀᴛᴀ\n│ ɴᴏᴅᴏꜱ: [ ${memberCount} ]\n╰─────────────┄\n\n`;

                        const botonesRemove = [
                            { text: 'VER CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }
                        ];

                        const mentions = [userJid];
                        if (authorJid) mentions.push(authorJid);

                        const opcionesRemove = {
                            title: groupName,
                            footer: global.developer,
                            image: typeof defaultImage === 'string' && defaultImage.startsWith('http') ? { url: defaultImage } : (Buffer.isBuffer(defaultImage) ? defaultImage : { url: defaultImage }),
                            mentions
                        };

                        await conn.sendButtonMessage(chatJid, txt, botonesRemove, opcionesRemove).catch(() => null);
                    })
                );
            }

            if (m.action === 'promote' && chat.detect) {
                await Promise.all(
                    m.participants.map(async (part) => {
                        const userJid = getRealJid(part);
                        if (!userJid) return;

                        const whoTag = `@${userJid.split('@')[0]}`;
                        const txt = `╭──────────────┄\n│〉 ɴᴜᴇᴠᴏ ᴀᴅᴍɪɴ\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ᴀꜱɪɢɴᴀᴅᴏ ᴘᴏʀ: ${authorTag}\n│〉 ɢʀᴜᴘᴏ: ${groupName}\n╰──────────────┄`;

                        const botonesPromote = [
                            { text: 'VER CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }
                        ];

                        const mentions = [userJid];
                        if (authorJid) mentions.push(authorJid);

                        const opcionesPromote = {
                            title: groupName,
                            footer: global.developer,
                            image: typeof defaultImage === 'string' && defaultImage.startsWith('http') ? { url: defaultImage } : (Buffer.isBuffer(defaultImage) ? defaultImage : { url: defaultImage }),
                            mentions
                        };

                        await conn.sendButtonMessage(chatJid, txt, botonesPromote, opcionesPromote).catch(() => null);
                    })
                );
            }

            if (m.action === 'demote' && chat.detect) {
                await Promise.all(
                    m.participants.map(async (part) => {
                        const userJid = getRealJid(part);
                        if (!userJid) return;

                        const whoTag = `@${userJid.split('@')[0]}`;
                        const txt = `╭──────────────┄\n│〉 ᴀᴅᴍɪɴ ʀᴇᴛɪʀᴀᴅᴏ\n│〉 ᴜꜱᴇʀ: ${whoTag}\n│〉 ʀᴇᴛɪʀᴀᴅᴏ ᴘᴏʀ: ${authorTag}\n│〉 ɢʀᴜᴘᴏ: ${groupName}\n╰──────────────┄`;

                        const botonesDemote = [
                            { text: 'VER CANAL', url: 'https://whatsapp.com/channel/0029VbC195k9xVJWUtGQ2m29' }
                        ];

                        const mentions = [userJid];
                        if (authorJid) mentions.push(authorJid);

                        const opcionesDemote = {
                            title: groupName,
                            footer: global.developer,
                            image: typeof defaultImage === 'string' && defaultImage.startsWith('http') ? { url: defaultImage } : (Buffer.isBuffer(defaultImage) ? defaultImage : { url: defaultImage }),
                            mentions
                        };

                        await conn.sendButtonMessage(chatJid, txt, botonesDemote, opcionesDemote).catch(() => null);
                    })
                );
            }
        } catch (e) {
            console.error(e);
        }
    });
}
