import fetch from "node-fetch";
import axios from 'axios';

const userSessions = new Map();

async function enviarPromptDixDeepAI(text, userId) {
  let session = userSessions.get(userId) || {};

  const payload = {
    text: text.trim(),
    ...(session.conversation_id && { conversation_id: session.conversation_id }),
    ...(session.auth_token && { auth_token: session.auth_token }),
    ...(session.session_cookie && { session_cookie: session.session_cookie }),
    ...(session.client_session_id && { client_session_id: session.client_session_id })
  };

  
  const apiKeyHeader = typeof apikey !== 'undefined' ? apikey : "";

  const { data: res } = await axios.get(`https://dix.lat/v1/deepai`, {
    params: payload,
    headers: {
      'x-api-key': apiKeyHeader,
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

  return res.data?.response || res.reply || '';
}

function limpiarTextoParaTTS(texto) {
  return texto
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[*_~#`>|[\]()\\{}]/g, " ")
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s,.;!?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function obtenerAudioTTS(texto) {
  const voces = ["6", "8"];
  const vozElegida = voces[Math.floor(Math.random() * voces.length)];
  const textoLimpio = limpiarTextoParaTTS(texto);

  if (!textoLimpio) {
    throw new Error("El texto procesado quedó vacío para la lectura.");
  }

  const url = `https://dix.lat/v1/tts?text=${encodeURIComponent(textoLimpio)}&voice=${vozElegida}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Error en API TTS: ${response.status}`);
  }

  return await response.buffer();
}

export const gptCommand = {
  category: "ai",
  commands: {
    meta: {
      name: "voice",
      run: async (m, { conn, text, usedPrefix, command }) => {
        if (!text) {
          return await conn.sendMessage(m.chat, {
            text: `> ⌗ Hola, escribe tu texto o usa *${usedPrefix + command} reset* para borrar tu contexto de voz.`
          }, { quoted: m });
        }

        const userId = m.sender;

        if (/^reset$/i.test(text.trim())) {
          userSessions.delete(userId);
          return await conn.sendMessage(m.chat, { text: `> ✅ Contexto de voz reiniciado.` }, { quoted: m });
        }

        await m.react("⏳");

        try {
          const respuestaDeepAI = await enviarPromptDixDeepAI(text, userId);

          if (!respuestaDeepAI) {
            throw new Error("Respuesta vacía de la IA");
          }

          const audioBuffer = await obtenerAudioTTS(respuestaDeepAI);

          await m.react("✅");
          await conn.sendMessage(m.chat, {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: false
          }, { quoted: m });

        } catch (e) {
          console.error(e);
          await m.react("❌");
          await conn.sendMessage(m.chat, {
            text: `> ⚔ ERROR: No se pudo generar la respuesta por voz.`
          }, { quoted: m });
        }
      }
    }
  }
};
