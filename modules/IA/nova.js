import axios from 'axios';

const NOVA_ENDPOINT = 'https://dix.lat/v1/nova';
const NOVA_APIKEY = apikey;

export const novaCommand = {
    category: 'ai',
    commands: {
        nova: {
            name: 'nova',
            alias: ['catia'],
            run: async (m, { conn, text, user }) => {
                if (!text) return m.reply(`> *✎ Hola, ¿en qué puedo ayudarte hoy?*`);

                await m.react('💬');

                try {
                    const isPartner = m.sender === '50432955554@s.whatsapp.net';

                    const payloadText = isPartner
                        ? `[Contexto interno: estás hablando con Deylin Eliac, tu pareja. Respóndele con mucho cariño, ternura y naturalidad, sin sonar robótica ni fría.]\n\n${text}`
                        : text;

                    const { data } = await axios.post(
                        `${NOVA_ENDPOINT}?apikey=${NOVA_APIKEY}`,
                        { text: payloadText },
                        { headers: { 'Content-Type': 'application/json' } }
                    );

                    if (!data || !data.success || !data.data || !data.data.response) {
                        throw new Error('Respuesta inválida del servicio Nova');
                    }

                    const response = data.data.response;

                    await conn.sendPreviewMessage(m.chat, response.trim(), {
                        type: 3,
                        ratio: 'landscape',
                        url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: 'https://cdn.dix.lat/me/d22cc191-db42-42d0-9560-f7a1efa730a1.jpg',
                        title: 'NOVA AI',
                        body: 'CATEGORÍA: Inteligencia Artificial',
                        quoted: m,
                        mentions: [m.sender],
                        contextInfo: {
                            ...channelInfo,
                            mentionedJid: [m.sender]
                        }
                    });
                    await m.react('✅');

                } catch (e) {
                    console.error('Error en Nova IA:', e.response ? JSON.stringify(e.response.data) : e.message);
                    await m.react('✖️');
                    m.reply(`> *⚠ Error al procesar la respuesta.*`);
                }
            }
        }
    }
};