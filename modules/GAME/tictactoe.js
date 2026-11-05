import { createCanvas } from '@napi-rs/canvas';

async function renderVisualBoardCanvas(board) {
    const canvas = createCanvas(600, 600);
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 600, 600);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 600);

    ctx.strokeStyle = '#2e2e4a';
    ctx.lineWidth = 10;
    ctx.strokeRect(15, 15, 570, 570);

    ctx.strokeStyle = '#4e54c8';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(210, 40); ctx.lineTo(210, 560);
    ctx.moveTo(390, 40); ctx.lineTo(390, 560);
    ctx.moveTo(40, 210); ctx.lineTo(560, 210);
    ctx.moveTo(40, 390); ctx.lineTo(560, 390);
    ctx.stroke();

    const centers = [
        { x: 125, y: 125 }, { x: 300, y: 125 }, { x: 475, y: 125 },
        { x: 125, y: 300 }, { x: 300, y: 300 }, { x: 475, y: 300 },
        { x: 125, y: 475 }, { x: 300, y: 475 }, { x: 475, y: 475 }
    ];

    for (let i = 0; i < 9; i++) {
        const { x, y } = centers[i];
        const val = board[i];

        if (val === ' ') {
            ctx.fillStyle = '#3a3a5c';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, x, y);
        } else if (val === 'X') {
            ctx.strokeStyle = '#ff4b2b';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.moveTo(x - 45, y - 45); ctx.lineTo(x + 45, y + 45);
            ctx.moveTo(x + 45, y - 45); ctx.lineTo(x - 45, y + 45);
            ctx.stroke();
        } else if (val === 'O') {
            ctx.strokeStyle = '#00f2fe';
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(x, y, 45, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    return canvas.toBuffer('image/png');
}

const checkWin = (b) => {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let w of wins) if (b[w[0]] !== ' ' && b[w[0]] === b[w[1]] && b[w[0]] === b[w[2]]) return b[w[0]];
    return b.includes(' ') ? null : 'tie';
};

function getBotMove(board, difficulty, botMark, userMark) {
    const available = board.map((v, i) => v === ' ' ? i : null).filter(v => v !== null);

    if (difficulty === 'FÁCIL') {
        return available[Math.floor(Math.random() * available.length)];
    }

    if (difficulty === 'NORMAL') {
        for (let pos of available) {
            let temp = [...board];
            temp[pos] = botMark;
            if (checkWin(temp) === botMark) return pos;
        }
        for (let pos of available) {
            let temp = [...board];
            temp[pos] = userMark;
            if (checkWin(temp) === userMark) return pos;
        }
        return available[Math.floor(Math.random() * available.length)];
    }

    function minimax(newBoard, player) {
        const availSpots = newBoard.map((v, i) => v === ' ' ? i : null).filter(v => v !== null);
        const result = checkWin(newBoard);

        if (result === userMark) return { score: -10 };
        if (result === botMark) return { score: 10 };
        if (result === 'tie') return { score: 0 };

        const moves = [];
        for (let i = 0; i < availSpots.length; i++) {
            const move = {};
            move.index = availSpots[i];
            newBoard[availSpots[i]] = player;

            if (player === botMark) {
                const res = minimax(newBoard, userMark);
                move.score = res.score;
            } else {
                const res = minimax(newBoard, botMark);
                move.score = res.score;
            }

            newBoard[availSpots[i]] = ' ';
            moves.push(move);
        }

        let bestMove;
        if (player === botMark) {
            let bestScore = -10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score > bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        } else {
            let bestScore = 10000;
            for (let i = 0; i < moves.length; i++) {
                if (moves[i].score < bestScore) {
                    bestScore = moves[i].score;
                    bestMove = i;
                }
            }
        }
        return moves[bestMove];
    }

    return minimax([...board], botMark).index;
}

export const ticTacToeCommand = {
    category: 'game',
    commands: {
        tictactoe: {
            name: 'tictactoe',
            alias: ['ttt', 'x0', 'tresenraya', 'delttt', 'salirttt'],
            async before(m, { conn }) {
                global.tttGames = global.tttGames || {};
                const game = global.tttGames[m.chat];
                if (!game || m.isBaileys || m.fromMe) return false;

                const txt = (m.text || '').trim();

                if (['DELTTT', 'SALIRTTT', 'ABANDONAR'].includes(txt.toUpperCase())) {
                    if (m.sender !== game.playerX && m.sender !== game.playerO) return false;
                    await m.react('👋');
                    await conn.sendMessage(m.chat, {
                        text: `🏁 *PARTIDA FINALIZADA*\n\n@${m.sender.split('@')[0]} ha decidido abandonar la partida.`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.tttGames[m.chat];
                    return true;
                }

                if (!/^[1-9]$/.test(txt)) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (quotedId && game.msgIds && !game.msgIds.includes(quotedId)) return false;

                if (m.sender !== game.playerX && m.sender !== game.playerO) return false;

                const currentTurnJid = game.turn === 'X' ? game.playerX : game.playerO;
                if (m.sender !== currentTurnJid) { await m.react('⏳'); return true; }

                const position = parseInt(txt) - 1;
                if (game.board[position] !== ' ') { await m.react('❓'); return true; }

                game.board[position] = game.turn;
                await m.react('✅');

                let winner = checkWin(game.board);

                if (!winner && game.isBot && game.turn === 'X') {
                    game.turn = 'O';
                    const botPos = getBotMove(game.board, game.dificultad, 'O', 'X');
                    if (botPos !== undefined) {
                        game.board[botPos] = 'O';
                    }
                    winner = checkWin(game.board);
                    if (!winner) game.turn = 'X';
                } else if (!winner) {
                    game.turn = game.turn === 'X' ? 'O' : 'X';
                }

                const bufferImagen = await renderVisualBoardCanvas(game.board);

                if (winner) {
                    let captionFinal = `🎮 *TRES EN RAYA - FIN*\n\n`;
                    let mentions = [];
                    if (winner === 'tie') {
                        captionFinal += `⚖️ *¡Es un EMPATE!*`;
                    } else {
                        const winnerJid = winner === 'X' ? game.playerX : game.playerO;
                        mentions.push(winnerJid);
                        if (winnerJid === game.botJid) {
                            captionFinal += `🤖 *¡EL BOT ES EL GANADOR!*`;
                        } else {
                            captionFinal += `🏆 *¡@${winnerJid.split('@')[0]} (${winner}) ES EL GANADOR!*`;
                        }
                    }

                    await conn.sendMessage(m.chat, {
                        image: bufferImagen,
                        caption: captionFinal,
                        contextInfo: { mentionedJid: mentions }
                    }, { quoted: m });

                    delete global.tttGames[m.chat];
                    return true;
                }

                const nextJid = game.turn === 'X' ? game.playerX : game.playerO;
                const nextText = `🎮 *TRES EN RAYA* ${game.isBot ? `(Dificultad: ${game.dificultad})` : ''}\n\nSigue el turno de *${game.turn}*: @${nextJid.split('@')[0]}\n\n📌 *Nota:* Envía un número del (1-9) para colocar tu ficha.\nSi deseas rendirte escribe *salirttt*.`;

                const enviadoSiguiente = await conn.sendMessage(m.chat, {
                    image: bufferImagen,
                    caption: nextText,
                    contextInfo: { mentionedJid: [nextJid] }
                }, { quoted: m });

                if (enviadoSiguiente?.key?.id) {
                    game.msgIds.push(enviadoSiguiente.key.id);
                }
                return true;
            },
            run: async (m, { conn, usedPrefix, command, args }) => {
                global.tttGames = global.tttGames || {};

                if (['delttt', 'salirttt'].includes(command.toLowerCase())) {
                    if (!global.tttGames[m.chat]) {
                        return conn.sendMessage(m.chat, { text: `⚠️ No hay ninguna partida activa en este grupo.` }, { quoted: m });
                    }
                    const game = global.tttGames[m.chat];
                    if (m.sender !== game.playerX && m.sender !== game.playerO) {
                        return conn.sendMessage(m.chat, { text: `❌ Solo los jugadores participantes pueden cancelar la partida.` }, { quoted: m });
                    }
                    delete global.tttGames[m.chat];
                    return conn.sendMessage(m.chat, { text: `🏁 La partida ha sido cancelada exitosamente.` }, { quoted: m });
                }

                if (global.tttGames[m.chat]) {
                    return conn.sendMessage(m.chat, { text: `⚠️ Ya hay una partida activa en este grupo.` }, { quoted: m });
                }
                if (!m.isGroup) {
                    return conn.sendMessage(m.chat, { text: `❌ Solo se puede jugar dentro de grupos.` }, { quoted: m });
                }

                const botJid = conn.user.jid || conn.user.id;
                const mentioned = m.mentionedJid[0] || (m.quoted ? m.quoted.sender : null);

                let isBot = false;
                let opponent = null;

                if (!mentioned) {
                    isBot = true;
                    opponent = botJid;
                } else if (mentioned === m.sender) {
                    return conn.sendMessage(m.chat, { text: `❌ No puedes jugar contra ti mismo.` }, { quoted: m });
                } else {
                    opponent = mentioned;
                    if (opponent.includes(botJid.split('@')[0]) || opponent === botJid) {
                        isBot = true;
                    }
                }

                let difTexto = 'NORMAL';
                if (isBot) {
                    let difInput = (args[0] || 'normal').toLowerCase();
                    if (['facil', 'fácil'].includes(difInput)) difTexto = 'FÁCIL';
                    if (['dificil', 'difícil'].includes(difInput)) difTexto = 'DIFÍCIL';
                }

                const p1 = m.sender.split('@')[0];
                const p2 = isBot ? 'BOT' : opponent.split('@')[0];

                const initialBoard = Array(9).fill(' ');
                const bufferImagen = await renderVisualBoardCanvas(initialBoard);

                const textoInicio = `🎮 *TRES EN RAYA - INICIO*\n\n@${p1} (❌) vs ${isBot ? '*BOT*' : `@${p2}`} (⭕) ${isBot ? `\n🎯 *Dificultad:* ${difTexto}` : ''}\n\nEmpieza el turno de *❌*: @${p1}\n\n📌 *Nota:* Envía un número del (1-9) para realizar tu movimiento.`;

                const enviado = await conn.sendMessage(m.chat, {
                    image: bufferImagen,
                    caption: textoInicio,
                    contextInfo: { mentionedJid: isBot ? [m.sender] : [m.sender, opponent] }
                }, { quoted: m });

                global.tttGames[m.chat] = {
                    board: initialBoard,
                    playerX: m.sender,
                    playerO: opponent,
                    turn: 'X',
                    isBot: isBot,
                    botJid: isBot ? botJid : null,
                    dificultad: difTexto,
                    msgIds: [enviado.key.id]
                };
                return true;
            }
        }
    }
};
