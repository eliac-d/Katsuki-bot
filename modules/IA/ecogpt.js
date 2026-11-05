import axios from 'axios';

const userSessions = new Map();

export const ecoGptModule = {
  category: 'ai',
  commands: {
    ecogpt: {
      name: 'ecogpt',
      alias: ['eco'],
      run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) {
          return conn.sendMessage(m.chat, {
            text: `[ ✰ ] Escribe tu *pregunta* para EcoGPT.\n\n*Ejemplos:*\n> ${usedPrefix + command} ¿Quién eres?\n> ${usedPrefix + command} reset ← borra contexto`
          }, { quoted: m });
        }

        const userId = m.sender;

        if (/^reset$/i.test(text.trim())) {
          userSessions.delete(userId);
          return conn.sendMessage(m.chat, { text: '[ ✅ ] Contexto reiniciado.' }, { quoted: m });
        }

        await m.react('🕓');

        try {
          let session = userSessions.get(userId) || {};

          const payload = {
            message: text.trim(),
            ...(session.conversation_id && { conversation_id: session.conversation_id }),
            ...(session.auth_token && { auth_token: session.auth_token }),
            ...(session.session_cookie && { session_cookie: session.session_cookie }),
            ...(session.client_session_id && { client_session_id: session.client_session_id })
          };

          const { data: res } = await axios.post('https://dix.lat/v1/ecogpt', payload, {
            headers: {
              'x-api-key': apikey,
              'Content-Type': 'application/json'
            }
          });

          if (!res || !res.ok) {
            throw new Error(res?.reply || 'Error al comunicarse con la API de EcoGPT.');
          }

          userSessions.set(userId, {
            conversation_id: res.conversation_id || session.conversation_id,
            auth_token: res.auth_token || session.auth_token,
            session_cookie: res.session_cookie || session.session_cookie,
            client_session_id: res.client_session_id || session.client_session_id
          });

          const mensajeFormateado = res.reply ? res.reply.trim() : '_Sin respuesta._';
          const thumbnail = await getBuffer('https://ecogpt.com/logo192.png').catch(() => null);
          const channelInfo = global.channelInfo || {};

          await conn.sendPreviewMessage(m.chat, mensajeFormateado, {
            type: 3, 
            ratio: 'landscape',
            url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
            thumbnail: thumbnail,
            title: 'ECOGPT',
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
          await m.react('✖️');
          await conn.sendMessage(m.chat, { text: `[ ✖️ ] Error:\n${e.message || 'desconocido'}` }, { quoted: m });
        }
      }
    }
  }
};

function getBuffer(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}
