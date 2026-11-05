import axios from 'axios';

const userSessions = new Map();

export const deepAiModule = {
  category: 'ai',
  commands: {
    deepai: {
      name: 'deepai',
      alias: ['ai2'],
      run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) {
          return conn.sendMessage(m.chat, {
            text: `[ ✰ ] Escribe tu *pregunta* para DeepAI.\n\n*Ejemplos:*\n> ${usedPrefix + command} ¿Quién eres?\n> ${usedPrefix + command} reset ← borra contexto`
          }, { quoted: m });
        }

        const userId = m.sender;

        if (/^reset$/i.test(text.trim())) {
          userSessions.delete(userId);
          return conn.sendMessage(m.chat, { text: '[ ✅ ] Contexto reiniciado.' }, { quoted: m });
        }

        await m.react('⏳');

        try {
          let session = userSessions.get(userId) || {};

          const payload = {
            text: text.trim(),
            ...(session.conversation_id && { conversation_id: session.conversation_id }),
            ...(session.auth_token && { auth_token: session.auth_token }),
            ...(session.session_cookie && { session_cookie: session.session_cookie }),
            ...(session.client_session_id && { client_session_id: session.client_session_id })
          };

          const { data: res } = await axios.get(`https://dix.lat/v1/deepai`, {
            params: payload,
            headers: {
              'x-api-key': apikey,
              'Accept': 'application/json'
            }
          });

          if (!res || !res.success) {
            throw new Error(res?.data?.response || 'Error al comunicarse con la API de DeepAI.');
          }

          userSessions.set(userId, {
            conversation_id: res.conversation_id || session.conversation_id,
            auth_token: res.auth_token || session.auth_token,
            session_cookie: res.session_cookie || session.session_cookie,
            client_session_id: res.client_session_id || session.client_session_id
          });

          const respuestaTexto = res.data?.response || res.reply || '_Sin respuesta._';
          const channelInfo = global.channelInfo || {};

          await conn.sendPreviewMessage(m.chat, respuestaTexto, {
            type: 3,
            ratio: 'landscape',
            url: global.surl ? global.surl(conn) : 'https://whatsapp.com',
            thumbnail: 'https://cdn.dix.lat/me/vbo0_20260827-c91x-hwl3-7f8f.jpg',
            title: 'DEEPAI',
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
          console.error(e);
          await m.react('❌');
          await conn.sendMessage(m.chat, {
            text: `> ⚔ ERROR: No se pudo conectar con el núcleo DEEPAI.`
          }, { quoted: m });
        }
      }
    }
  }
};
