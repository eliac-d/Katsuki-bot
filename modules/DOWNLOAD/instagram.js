import fetch from 'node-fetch'

export const instagramDownloadModule = {
    category: 'descargas',
    commands: {
        instagram: {
            name: 'instagram',
            alias: ['ig', 'reels', 'reel'],
            run: async (m, { conn, args }) => {
                if (!args[0]) return m.reply(`*✰ Ingresa un enlace de Instagram.*`)

                const regexInstagram = /^(https?:\/\/)?(www\.)?(instagram\.com|instagr\.am)\/(p|reels|reel|tv)\/[^\s]+$/i
                if (!regexInstagram.test(args[0])) return m.reply(`*ஐ Enlace no válido.*`)

                try {
                    if (m.react) await m.react("⏳")

                    const res = await fetch(`https://dix.lat/v1/instagram?url=${encodeURIComponent(args[0])}`, {
                        headers: {
                            'x-api-key': apikey,
                            'Accept': 'application/json'
                        }
                    })
                    const json = await res.json()

                    if (!json.success || !json.data || !json.data.data || !json.data.data[0]?.url) {
                        throw new Error("No video found")
                    }

                    const video = json.data.data[0].url

                    const caption = `\t\t\t*INSTAGRAM DOWNLOADER*\n\n> ム *Tipo:* Post/Reel\n> ღ *Link:* ${args[0]}\n`

                    await conn.sendMessage(m.chat, { 
                        video: { url: video }, 
                        caption: caption 
                    }, { quoted: m })

                    if (m.react) await m.react("✅")
                } catch (e) {
                    console.error(e)
                    if (m.react) await m.react("❌")
                    m.reply(`⍰ Error al procesar Instagram.\n\nUsa el comando *#report* para reportar este error.`)
                }
            }
        }
    }
}
