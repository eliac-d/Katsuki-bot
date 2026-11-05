import { createCanvas } from '@napi-rs/canvas';

async function generarImagenPPT(usuario, bot, resultadoTexto) {
    const canvas = createCanvas(600, 300);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 600, 300);
    grad.addColorStop(0, '#1e1e2f');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 300);

    ctx.strokeStyle = '#3a3a5c';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, 580, 280);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PIEDRA, PAPEL O TIJERA', 300, 45);

    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(40, 70, 220, 140);
    ctx.strokeStyle = '#4e54c8';
    ctx.lineWidth = 3;
    ctx.strokeRect(40, 70, 220, 140);

    ctx.fillStyle = '#8f94fb';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('JUGADOR', 150, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(usuario, 150, 155);

    ctx.fillStyle = '#ff4b2b';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('VS', 300, 150);

    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(340, 70, 220, 140);
    ctx.strokeStyle = '#ff416c';
    ctx.lineWidth = 3;
    ctx.strokeRect(340, 70, 220, 140);

    ctx.fillStyle = '#ff416c';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('BOT', 450, 100);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(bot, 450, 155);

    let colorResultado = '#ffff00';
    if (resultadoTexto.includes('GANASTE')) colorResultado = '#00ff88';
    if (resultadoTexto.includes('PERDISTE')) colorResultado = '#ff3366';

    ctx.fillStyle = colorResultado;
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(resultadoTexto, 300, 255);

    return canvas.toBuffer('image/png');
}

export const pptCommand = {
    category: 'game',
    commands: {
        ppt: {
            name: 'ppt',
            alias: ['piedrapapeltijera', 'jugarppt'],
            async before(m, { conn }) {
                global.pptMemory = global.pptMemory || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.pptMemory[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                let entrada = m.text.trim().toUpperCase();
                const mapaOpciones = {
                    '1': 'PIEDRA',
                    '2': 'PAPEL',
                    '3': 'TIJERA',
                    'PIEDRA': 'PIEDRA',
                    'PAPEL': 'PAPEL',
                    'TIJERA': 'TIJERA'
                };

                const usuario = mapaOpciones[entrada];
                if (!usuario) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (quotedId && game.msgIds && !game.msgIds.includes(quotedId)) {
                    return false;
                }

                game.intentos = (game.intentos || 0) + 1;

                let bot;
                const rand = Math.random();

                let probAnalisis = 0;
                if (game.dificultad === 'NORMAL') probAnalisis = 0.5;
                if (game.dificultad === 'DIFÍCIL') probAnalisis = 0.85;

                if (game.history.length > 0 && rand < probAnalisis) {
                    const counts = game.history.reduce((acc, move) => {
                        acc[move] = (acc[move] || 0) + 1;
                        return acc;
                    }, {});
                    const masJugado = Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
                    bot = masJugado === 'PIEDRA' ? 'PAPEL' : masJugado === 'PAPEL' ? 'TIJERA' : 'PIEDRA';
                } else {
                    const opciones = ['PIEDRA', 'PAPEL', 'TIJERA'];
                    bot = opciones[Math.floor(Math.random() * opciones.length)];
                }

                game.history.push(usuario);

                let resultado;
                let resultadoLimpio;
                if (usuario === bot) {
                    resultado = '🤝 *EMPATE*';
                    resultadoLimpio = 'EMPATE';
                    game.empates++;
                } else if (
                    (usuario === 'PIEDRA' && bot === 'TIJERA') ||
                    (usuario === 'PAPEL' && bot === 'PIEDRA') ||
                    (usuario === 'TIJERA' && bot === 'PAPEL')
                ) {
                    resultado = '🎉 *GANASTE*';
                    resultadoLimpio = '¡GANASTE!';
                    game.victorias++;
                } else {
                    resultado = '🤖 *PERDISTE*';
                    resultadoLimpio = 'PERDISTE';
                    game.derrotas++;
                }

                const bufferImagen = await generarImagenPPT(usuario, bot, resultadoLimpio);

                let captionTexto = `🎮 *Ronda ${game.intentos}/3* (Dificultad: ${game.dificultad})\n\nTú: *${usuario}*\nBot: *${bot}*\n${resultado}`;
                if (game.intentos < 3) {
                    captionTexto += `\n\nElija su siguiente jugada (Escriba el nombre o el número):\n1. PIEDRA\n2. PAPEL\n3. TIJERA`;
                }

                const enviadoRonda = await conn.sendMessage(m.chat, {
                    image: bufferImagen,
                    caption: captionTexto
                }, { quoted: m });

                if (enviadoRonda?.key?.id) {
                    game.msgIds.push(enviadoRonda.key.id);
                }

                if (game.intentos >= 3) {
                    const final = `🏁 *FIN DE LA PARTIDA*\n\nModo: *${game.dificultad}*\nVictorias: ${game.victorias}\nDerrotas: ${game.derrotas}\nEmpates: ${game.empates}\n\n${game.victorias > game.derrotas ? '¡Eres un experto!' : '¡El Bot te dominó!'}`;
                    await conn.sendMessage(m.chat, { text: final }, { quoted: m });
                    delete global.pptMemory[gameId];
                }
                return true;
            },
            run: async (m, { conn, args }) => {
                global.pptMemory = global.pptMemory || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.pptMemory[gameId]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya tienes una partida de 3 intentos en curso.` }, { quoted: m });
                }

                let dificultad = (args[0] || 'normal').toLowerCase();
                if (!['facil', 'fácil', 'normal', 'dificil', 'difícil'].includes(dificultad)) {
                    dificultad = 'normal';
                }

                let difTexto = 'NORMAL';
                if (dificultad === 'facil' || dificultad === 'fácil') difTexto = 'FÁCIL';
                if (dificultad === 'dificil' || dificultad === 'difícil') difTexto = 'DIFÍCIL';

                const texto = `🎮 *Piedra, Papel o Tijera*\n🎯 *Dificultad:* ${difTexto}\n\nEscribe tu jugada o envía solo el número:\n1. PIEDRA\n2. PAPEL\n3. TIJERA`;
                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.pptMemory[gameId] = {
                    intentos: 0,
                    victorias: 0,
                    derrotas: 0,
                    empates: 0,
                    history: [],
                    msgIds: [enviado.key.id],
                    dificultad: difTexto
                };
                return true;
            }
        }
    }
};
