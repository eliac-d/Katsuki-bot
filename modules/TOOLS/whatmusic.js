import fetch from 'node-fetch';
import FormData from 'form-data';


const DIX_API_KEY = apikey;

async function identifySong(buffer, filename = 'audio.mp3', mimetype = 'audio/mpeg') {
  const form = new FormData();
  form.append('file', buffer, { filename, contentType: mimetype });

  const res = await fetch('https://dix.lat/v1/shazam', {
    method: 'POST',
    headers: {
      'x-api-key': DIX_API_KEY,
      ...form.getHeaders()
    },
    body: form
  });

  if (!res.ok) return null;
  return res.json();
}

function formatDuration(ms) {
  if (!ms) return 'N/A';
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export const whatmusicCommand = {
  category: 'tools',
  commands: {
    whatmusic: {
      name: 'whatmusic',
      alias: ['shazam', 'quemusica', 'reconocer'],
      run: async (m, { usedPrefix, command }) => {
        try {
          const q = m.quoted ? m.quoted : m;
          const mime = q.mimetype || (q.msg || {}).mimetype || '';

          if (!/audio|video/.test(mime)) {
            return m.reply(
              `> ✎ USO: Responde a un audio con *${usedPrefix + command}*\n` +
              `> ✎ También sirve con videos cortos.`
            );
          }

          await m.react('🔍');

          let buffer;
          try {
            buffer = await q.download();
          } catch {
            buffer = null;
          }

          if (!buffer) {
            await m.react('✖️');
            return m.reply('> ⚔ ERROR: No se pudo descargar el archivo.');
          }

          const json = await identifySong(
            buffer,
            mime.includes('video') ? 'audio.mp4' : 'audio.mp3',
            mime
          );

          if (!json || !json.success || !json.data) {
            await m.react('✖️');
            return m.reply('> ⚔ ERROR: No se pudo reconocer la canción.');
          }

          const d = json.data;
          const artists = Array.isArray(d.artists) ? d.artists.join(', ') : (d.artists || 'Desconocido');
          const genres = Array.isArray(d.genres) ? d.genres.join(', ') : (d.genres || 'N/A');

          let txt = `*🎵 CANCIÓN RECONOCIDA*\n\n`;
          txt += `> ▢ *TÍTULO:* ${d.title || 'Desconocido'}\n`;
          txt += `> ▢ *ARTISTA(S):* ${artists}\n`;
          txt += `> ▢ *ÁLBUM:* ${d.album || 'N/A'}\n`;
          txt += `> ▢ *GÉNEROS:* ${genres}\n`;
          txt += `> ▢ *LANZAMIENTO:* ${d.releaseDate || 'N/A'}\n`;
          txt += `> ▢ *DISQUERA:* ${d.label || 'N/A'}\n`;
          txt += `> ▢ *DURACIÓN:* ${formatDuration(d.durationMs)}\n`;
          txt += `> ▢ *COINCIDENCIA:* ${d.score ?? 0}%`;

          
          const ytUrl = d.youtube?.url || null;
          if (ytUrl) {
            txt += `\n\n> 🔗 *YouTube:* ${ytUrl}`;
          }

          await m.react('✅');
          await conn.sendPreviewMessage(m.chat, txt, {
                        type: 3, 
                        ratio: 'landscape',
                        url: global.surl() ? global.surl(conn) : 'https://whatsapp.com',
                        thumbnail: 'https://cdn.dix.lat/me/4yvn_20261102-r2x1-i6y1-6d7e.jpg',
                        title: '¿Whatmusic?',
                        quoted: m,
                        
                    });
        } catch (e) {
          await m.react('✖️');
          return m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
      }
    }
  }
};