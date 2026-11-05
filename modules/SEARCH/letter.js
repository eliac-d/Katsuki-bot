import fetch from 'node-fetch';

const HEADERS = {
  'User-Agent': 'DeylinLyricsBot/2.0'
};

function cleanLyrics(lyrics = '') {
  return String(lyrics)
    .replace(/\r/g, '')
    .replace(/^\[\d{1,2}:\d{2}(?:[.:]\d{1,2})?\]\s*/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function formatLyrics(title, artist, lyrics, extra = {}) {
  let txt = `*走    LETRA ENCONTRADA*\n\n`;
  txt += `> ▢ *TÍTULO:* ${title || 'Desconocido'}\n`;
  txt += `> ▢ *ARTISTA:* ${artist || 'Desconocido'}\n`;
  if (extra.album) txt += `> ▢ *ÁLBUM:* ${extra.album}\n`;
  if (extra.durationFormatted) txt += `> ▢ *DURACIÓN:* ${extra.durationFormatted}\n`;
  txt += `\n${lyrics || 'Letra no disponible.'}`;
  return txt;
}

async function getLyricsFromDix(query) {
  try {
    const url = `https://dix.lat/v1/letters?q=${encodeURIComponent(query)}`;
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) return null;

    const body = await res.json();
    if (!body.success || !body.data) return null;

    const data = body.data;
    const rawLyrics = data.answer || cleanLyrics(data.synced || '');
    if (!rawLyrics) return null;

    return {
      title: data.track || data.title,
      artist: data.artist,
      album: data.album,
      durationFormatted: data.durationFormatted,
      cover: data.cover,
      lyrics: cleanLyrics(rawLyrics)
    };
  } catch {
    return null;
  }
}

export const lyricsCommand = {
  category: 'tools',
  commands: {
    letra: {
      name: 'letra',
      alias: ['lyrics', 'lrc'],
      run: async (m, { text, usedPrefix, command }) => {
        if (!text) {
          return m.reply(
            `> ✎ USO: ${usedPrefix + command} <nombre de la canción o frase>\n` +
            `> ✎ Ejemplo: ${usedPrefix + command} chachacha josean log`
          );
        }

        await m.react('🔍');

        try {
          const result = await getLyricsFromDix(text);

          if (!result || !result.lyrics) {
            await m.react('✖️');
            return m.reply(
              `> ⚔ ERROR: No encontré la letra en la base de datos.\n` +
              `> ▢ *Buscado como:* ${text}`
            );
          }

          await m.react('✅');
          return m.reply(
            formatLyrics(result.title, result.artist, result.lyrics, result)
          );
        } catch (e) {
          await m.react('✖️');
          return m.reply(`> ⚔ ERROR CRÍTICO: ${e.message}`);
        }
      }
    }
  }
};