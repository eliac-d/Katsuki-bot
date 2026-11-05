const frases = {
    nombres: ["El Brayan", "El Kevin", "Lic. en MiAle", "El Temach Jr", "El de los elotes", "Don Comedia", "El Toluco"],
    ubicaciones: ["En el Smart de la Jilotepec", "En el centro de Juárez", "En el Oxxo llorando", "Escondido en casa de su ex", "En las segundas de la Chaveña", "Debajo del puente"],
    dispositivos: ["Nokia de lamparita", "Alcatel del Oxxo", "iPhone 6 con pantalla rota", "Lanix del gobierno", "Samsumg Galaxy Y"],
    estados: ["Sin novia desde 2019", "Pidiendo fiado en el Oxxo", "Esperando que le contesten el whats", "Viendo TikToks a las 3am", "Jugando Free con lag", "Deudor de Alimentos"],
    ips: ["127.0.0.1 (No me hagas rastrearte)", "192.168.1.1 (WiFi del vecino)", "10.0.0.1 (El Ciber de la esquina)", "0.0.0.0 (Ni internet tiene)"]
};

function random(arr) { 
    return arr[Math.floor(Math.random() * arr.length)]; 
}

export const doxfakeModule = {
    category: 'FUN',
    commands: {
        dox: {
            name: 'dox',
            alias: ['doxear', 'doxfake', 'fakeip'],
            desc: 'Genera datos de doxeo falsos con fines de entretenimiento.',
            run: async (m, { conn }) => {
                let targetJid = m.quoted ? m.quoted.sender : (m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.sender);

                await m.react('🔍');

                const doxResult = 
                    `🕵️‍♂️ *DOXEO FALSO EXITOSO* 🔍\n\n` +
                    `👤 *Objetivo:* @${targetJid.split('@')[0]}\n` +
                    `🏷️ *Apodo Secreto:* ${random(frases.nombres)}\n` +
                    `📍 *Ubicación Actual:* ${random(frases.ubicaciones)}\n` +
                    `📱 *Dispositivo:* ${random(frases.dispositivos)}\n` +
                    `🧠 *Estado Mental:* ${random(frases.estados)}\n` +
                    `🌐 *IP Pública:* \`${random(frases.ips)}\`\n\n` +
                    `_⚠️ Todo lo mostrado arriba es 100% falso con fines de broma._`;

                return conn.sendMessage(m.chat, {
                    text: doxResult,
                    mentions: [targetJid]
                }, { quoted: m });
            }
        }
    }
};
