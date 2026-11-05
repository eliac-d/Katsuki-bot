import { jidNormalizedUser } from '@whiskeysockets/baileys';

export const antitoxicModule = {
    commands: {
        antitoxic: {
          //  name: 'antitoxic.v.wj.wyi',
            alias: [],
            async before(m, { conn, isOwner, chat }) {
                if (!m.isGroup || !chat?.antiToxic || isOwner || m.fromMe || m.isBaileys) return false;

                const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
                if (!groupMetadata) return false;

                const participant = groupMetadata.participants.find(p => p.id === m.sender);
                const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin';

                if (isAdmin) return false;

                const rawText = [
                    m.text || '',
                    m.body || '',
                    m.caption || '',
                    m.msg?.text || '',
                    m.msg?.caption || '',
                    m.message?.conversation || '',
                    m.message?.extendedTextMessage?.text || ''
                ].join(' ');

                if (!rawText.trim()) return false;

                const toxicWords = [
                    'callate', 'callese', 'calate', 'ctm', 'cdtm', 
                    'alv', 'plp', 'mrd', 'vtw', 'ptm', 'pso',
                    'puto', 'puta', 'put0', 'put4', 'pito', 'maldito', 'maldita', 
                    'estupido', 'estupida', 'pendejo', 'pendeja', 
                    'pndjo', 'pndja', 'pendej0', 'idiota', 'id1ota', 'maricon', 
                    'vete a la mierda', 'mierda', 'basura', 'inutil', 'perra', 
                    'zorra', 'bastardo', 'bastarda', 'imbecil', 'tarado', 'tarada'
                ];

                const cleanText = rawText
                    .toLowerCase()
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '');

                const hasToxicWord = toxicWords.some(word => cleanText.includes(word));
                if (!hasToxicWord) return false;

                const botId = jidNormalizedUser(conn.user.id);
                const botParticipant = groupMetadata.participants.find(p => p.id === botId);
                const isBotAdmin = botParticipant?.admin === 'admin' || botParticipant?.admin === 'superadmin';

                if (!global.db) global.db = { data: { users: {} } };
                if (!global.db.data) global.db.data = { users: {} };
                if (!global.db.data.users) global.db.data.users = {};
                if (!global.db.data.users[m.sender]) global.db.data.users[m.sender] = { warn: 0 };

                const user = global.db.data.users[m.sender];
                user.warn = (user.warn || 0) + 1;

                if (isBotAdmin) {
                    await conn.sendMessage(m.chat, { delete: m.key }).catch(() => null);
                }

                if (user.warn >= 3) {
                    user.warn = 0;
                    await m.reply(`⚠️ *@${m.sender.split('@')[0]}* has alcanzado 3 advertencias por vocabulario tóxico y serás eliminado.`, null, { mentions: [m.sender] }).catch(() => null);

                    if (isBotAdmin) {
                        await new Promise(r => setTimeout(r, 500));
                        await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove').catch(() => null);
                    }
                } else {
                    await m.reply(`⚠️ *@${m.sender.split('@')[0]}*, evita usar palabras ofensivas, expresiones tóxicas o abreviaciones inapropiadas.\n\n*Advertencias:* ${user.warn}/3`, null, { mentions: [m.sender] }).catch(() => null);
                }

                return true;
            }
        }
    }
};
