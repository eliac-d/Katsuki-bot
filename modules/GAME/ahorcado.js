import { createCanvas } from '@napi-rs/canvas';

const palabras = [
    { palabra: 'PROGRAMACION', pista: 'Actividad de escribir codigo para software' },
    { palabra: 'WHATSAPP', pista: 'Aplicacion de mensajeria instantanea' },
    { palabra: 'JAVASCRIPT', pista: 'Lenguaje de programacion popular en la web' },
    { palabra: 'TECLADO', pista: 'Periferico usado para escribir en la computadora' },
    { palabra: 'DATABASE', pista: 'Lugar donde se almacenan y organizan los datos' },
    { palabra: 'INTERNET', pista: 'Red global de redes de comunicacion' },
    { palabra: 'ALGORITMO', pista: 'Conjunto ordenado de instrucciones para resolver un problema' },
    { palabra: 'SERVIDOR', pista: 'Equipo informatico que provee servicios a otros equipos' },
    { palabra: 'PANTALLA', pista: 'Superficie donde se muestran las imagenes del dispositivo' },
    { palabra: 'AUDIFONOS', pista: 'Dispositivo para escuchar audio de forma privada' },
    { palabra: 'PYTHON', pista: 'Lenguaje de programación famoso por su sencillez' },
    { palabra: 'GITHUB', pista: 'Plataforma para alojar y compartir proyectos de código' },
    { palabra: 'SISTEMA', pista: 'Conjunto de elementos que interactúan entre sí' },
    { palabra: 'MEMORIA', pista: 'Componente que almacena información temporal o permanente' },
    { palabra: 'MONITOR', pista: 'Pantalla de la computadora' },
    { palabra: 'PROCESADOR', pista: 'El cerebro de la computadora' },
    { palabra: 'VARIABLE', pista: 'Espacio reservado en memoria para guardar un valor' },
    { palabra: 'FUNCION', pista: 'Bloque de código reutilizable que realiza una tarea' },
    { palabra: 'COMPILADOR', pista: 'Traduce código fuente a lenguaje máquina' },
    { palabra: 'LINUX', pista: 'Sistema operativo de código abierto muy usado en servidores' },
    { palabra: 'MINECRAFT', pista: 'Juego de construcción con bloques infinitos' },
    { palabra: 'KIRITO', pista: 'El espadachín negro de Sword Art Online' },
    { palabra: 'POKEMON', pista: 'Monstruos de bolsillo para atrapar y entrenar' },
    { palabra: 'PLAYSTATION', pista: 'Famosa consola de videojuegos desarrollada por Sony' },
    { palabra: 'NINTENDO', pista: 'Compañía creadora de Mario y Zelda' },
    { palabra: 'XBOX', pista: 'Marca de consolas desarrollada por Microsoft' },
    { palabra: 'VALORANT', pista: 'Shooter táctico en primera persona de Riot Games' },
    { palabra: 'FORTNITE', pista: 'Juego Battle Royale muy popular de Epic Games' },
    { palabra: 'OTAKU', pista: 'Persona aficionada al anime y la cultura japonesa' },
    { palabra: 'MANGA', pista: 'Cómic o historieta de origen japonés' },
    { palabra: 'COSPLAY', pista: 'Disfrazarse de un personaje de ficción' },
    { palabra: 'NARUTO', pista: 'Ninja rubio que sueña con ser Hokage' },
    { palabra: 'GOKU', pista: 'Saiyajin criado en la Tierra que protege el universo' },
    { palabra: 'SHINGEKI', pista: 'Anime enfocado en la lucha de la humanidad contra titanes' },
    { palabra: 'ONEPIECE', pista: 'Historia sobre piratas en busca del gran tesoro' },
    { palabra: 'ZELDA', pista: 'Princesa del reino de Hyrule en famosa saga de juegos' },
    { palabra: 'MARIO', pista: 'Fontanero de bigote rojo de Nintendo' },
    { palabra: 'PIKACHU', pista: 'Ratón eléctrico y mascota principal de Pokémon' },
    { palabra: 'STREAMER', pista: 'Persona que transmite en vivo jugando o hablando' },
    { palabra: 'DISCORD', pista: 'Plataforma de voz y texto muy usada por gamers' },
    { palabra: 'MEXICO', pista: 'País famoso por los tacos, el tequila y el mariachi' },
    { palabra: 'ARGENTINA', pista: 'País sudamericano conocido por el tango y el asado' },
    { palabra: 'ESPAÑA', pista: 'País europeo famoso por la paella y el flamenco' },
    { palabra: 'COLOMBIA', pista: 'País famoso por su café de alta calidad' },
    { palabra: 'JAPON', pista: 'País insular del este de Asia conocido como el Sol Naciente' },
    { palabra: 'PIRAMIDE', pista: 'Estructura monumental antigua con base poligonal' },
    { palabra: 'VOLCAN', pista: 'Abertura en la tierra por donde sale lava y ceniza' },
    { palabra: 'OCEANO', pista: 'Gran extensión de agua salada que cubre el planeta' },
    { palabra: 'DESIERTO', pista: 'Zona árida con muy pocas lluvias y mucha arena' },
    { palabra: 'MONTAÑA', pista: 'Gran elevación natural del terreno' },
    { palabra: 'CASCADA', pista: 'Caída grande de agua desde cierta altura' },
    { palabra: 'PLANETA', pista: 'Cuerpo celeste que orbita alrededor de una estrella' },
    { palabra: 'GALAXIA', pista: 'Conjunto enorme de estrellas, polvo y gas' },
    { palabra: 'COMETA', pista: 'Cuerpo celeste congelado que deja una estela de luz' },
    { palabra: 'ECLIPSE', pista: 'Ocultación temporal de un astro por la sombra de otro' },
    { palabra: 'GUITARRA', pista: 'Instrumento musical de seis cuerdas' },
    { palabra: 'BICICLETA', pista: 'Vehículo de dos ruedas impulsado por pedales' },
    { palabra: 'AUTOMOVIL', pista: 'Vehículo de cuatro ruedas con motor' },
    { palabra: 'TELEVISOR', pista: 'Aparato electrónico para ver programas e imágenes' },
    { palabra: 'REFRIGERADOR', pista: 'Electrodoméstico que mantiene fríos los alimentos' },
    { palabra: 'LAMPARA', pista: 'Objeto que sirve para alumbrar un espacio' },
    { palabra: 'ALMOHADA', pista: 'Bolsa blanda que sirve para apoyar la cabeza al dormir' },
    { palabra: 'MICROFONO', pista: 'Aparato que transforma el sonido en señales eléctricas' },
    { palabra: 'ESPEJO', pista: 'Superficie de cristal que refleja la imagen' },
    { palabra: 'CAMISETA', prenda: 'Prenda de vestir ligera de manga corta o larga' },
    { palabra: 'ZAPATILLAS', pista: 'Calzado cómodo usado para hacer deporte' },
    { palabra: 'MOCHILA', pista: 'Bolsa para llevar objetos en la espalda' },
    { palabra: 'CUADERNO', pista: 'Conjunto de hojas de papel unidas para escribir' },
    { palabra: 'RELOJ', pista: 'Instrumento para medir el tiempo y dar la hora' },
    { palabra: 'PARAGUAS', pista: 'Objeto que protege de la lluvia' },
    { palabra: 'DINOSAURIO', pista: 'Reptil gigante extinto hace millones de años' },
    { palabra: 'PINGÜINO', pista: 'Ave marina que no vuela y vive en zonas frías' },
    { palabra: 'TIBURON', pista: 'Pez depredador de grandes dientes en el océano' },
    { palabra: 'ELEFANTE', pista: 'El mamífero terrestre más grande del mundo con trompa' },
    { palabra: 'COCODRILO', pista: 'Reptil semiacuático grande de fuertes mandíbulas' },
    { palabra: 'SERPIENTE', pista: 'Reptil sin patas que se desplaza arrastrándose' },
    { palabra: 'JIRAFA', pista: 'Animal terrestre más alto del mundo con cuello largo' },
    { palabra: 'LEON', pista: 'Conocido popularmente como el rey de la selva' },
    { palabra: 'CANGURO', pista: 'Mamífero marsupial de Australia que se desplaza a saltos' },
    { palabra: 'DELFIN', pista: 'Mamífero acuático inteligente famoso por sus saltos' },
    { palabra: 'MARIPOSA', pista: 'Insecto volador con alas de hermosos colores' },
    { palabra: 'AGUILA', pista: 'Ave rapaz de gran tamaño y vista privilegeda' },
    { palabra: 'TIGRE', pista: 'Gran felino de pelaje anaranjado con rayas negras' },
    { palabra: 'MURCIELAGO', pista: 'Único mamífero capaz de volar' },
    { palabra: 'GATO', pista: 'Felino doméstico muy independiente y popular' },
    { palabra: 'CHOCOLATE', pista: 'Dulce hecho a base de cacao y azúcar' },
    { palabra: 'PIZZA', pista: 'Plato italiano a base de masa, tomate y queso' },
    { palabra: 'HAMBURGUESA', pista: 'Pan con carne picada en el centro e ingredientes variados' },
    { palabra: 'ESPAGUETI', pista: 'Tipo de pasta alargada muy popular' },
    { palabra: 'HELADO', pista: 'Postre congelado de leche o agua de diversos sabores' },
    { palabra: 'MANZANA', pista: 'Fruta redonda de color rojo, verde o amarillo' },
    { palabra: 'SANDIA', pista: 'Fruta grande, verde por fuera y roja por dentro' },
    { palabra: 'CERVEZA', pista: 'Bebida alcohólica hecha a base de cebada' },
    { palabra: 'CUPCAKE', pista: 'Pequeño pastel horneado individual con decoración' },
    { palabra: 'ENSALADA', pista: 'Mezcla de hortalizas picadas, frescas y aderezadas' },
    { palabra: 'FUTBOL', pista: 'Deporte donde 11 jugadores buscan meter un balón al arco' },
    { palabra: 'BALONCESTO', pista: 'Deporte donde se encesta un balón en una canasta elevada' },
    { palabra: 'MUSICA', pista: 'Arte de combinar sonidos de forma armoniosa' },
    { palabra: 'PELICULA', pista: 'Obra cinematográfica que cuenta una historia' },
    { palabra: 'CUMPLEAÑOS', pista: 'Aniversario del nacimiento de una persona' }
];

function normalizeLetra(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

function normalizePalabra(p) {
    if (!p) return '';
    return p.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Ü/g, 'U').toUpperCase();
}

function generateHangmanImage({ oculta, intentos, estado = 'jugando' }) {
    const W = 600;
    const H = 550;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#101019');
    bg.addColorStop(1, '#1c1c2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#2a2a40';
    ctx.fillRect(100, 380, 200, 14);
    ctx.fillRect(150, 80, 14, 300);
    ctx.fillRect(150, 80, 150, 14);
    ctx.fillRect(296, 80, 6, 45);

    ctx.strokeStyle = '#3a3a5a';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(150, 130);
    ctx.lineTo(200, 80);
    ctx.stroke();

    ctx.strokeStyle = '#E6E6F0';
    ctx.lineWidth = 5;

    const drawHead = () => {
        ctx.beginPath();
        ctx.arc(299, 150, 25, 0, Math.PI * 2);
        ctx.stroke();
        if (estado === 'perdido') {
            ctx.beginPath();
            ctx.moveTo(290, 143);
            ctx.lineTo(296, 149);
            ctx.moveTo(296, 143);
            ctx.lineTo(290, 149);
            ctx.moveTo(302, 143);
            ctx.lineTo(308, 149);
            ctx.moveTo(308, 143);
            ctx.lineTo(302, 149);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#E6E6F0';
            ctx.beginPath();
            ctx.arc(291, 147, 3, 0, Math.PI * 2);
            ctx.arc(307, 147, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    };

    const drawBody = () => {
        ctx.beginPath();
        ctx.moveTo(299, 175);
        ctx.lineTo(299, 260);
        ctx.stroke();
    };

    const drawArmL = () => {
        ctx.beginPath();
        ctx.moveTo(299, 190);
        ctx.lineTo(265, 215);
        ctx.stroke();
    };

    const drawArmR = () => {
        ctx.beginPath();
        ctx.moveTo(299, 190);
        ctx.lineTo(333, 215);
        ctx.stroke();
    };

    const drawLegL = () => {
        ctx.beginPath();
        ctx.moveTo(299, 260);
        ctx.lineTo(270, 310);
        ctx.stroke();
    };

    const drawLegR = () => {
        ctx.beginPath();
        ctx.moveTo(299, 260);
        ctx.lineTo(328, 310);
        ctx.stroke();
    };

    if (intentos >= 1) drawHead();
    if (intentos >= 2) drawBody();
    if (intentos >= 3) drawArmL();
    if (intentos >= 4) drawArmR();
    if (intentos >= 5) drawLegL();
    if (intentos >= 6) drawLegR();

    ctx.font = '700 36px JetBrains Mono, Monospace';
    ctx.textAlign = 'center';

    const charSpacing = 35;
    const totalWidth = oculta.length * charSpacing;
    const startX = (W - totalWidth) / 2 + charSpacing / 2;
    const yPos = 480;

    for (let i = 0; i < oculta.length; i++) {
        let x = startX + (i * charSpacing);
        let charToShow = oculta[i];

        if (charToShow !== '_') {
            ctx.fillStyle = '#6bff95';
            ctx.fillText(charToShow, x, yPos - 10);
        }

        ctx.fillStyle = '#3a3a5a';
        ctx.fillRect(x - 12, yPos, 24, 4);
    }

    return canvas.toBuffer('image/png');
}

export const mathCommand = {
    category: 'game',
    commands: {
        math: {
            name: 'math',
            alias: ['mate', 'calculo'],
            async before(m, { conn }) {
                const txt = (m.text || '').trim();
                if (!txt || m.isBaileys || m.fromMe || /^[#!./]/.test(txt)) return false;

                global.mathGames = global.mathGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                if (!global.mathGames[gameId]) return false;

                const game = global.mathGames[gameId];
                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== game.msgId) return false;

                const userAns = parseInt(txt);
                if (isNaN(userAns)) return false;

                if (userAns === game.result) {
                    await m.react('✅');
                    await conn.sendMessage(m.chat, {
                        text: `🎉 ¡@${m.sender.split('@')[0]} eres un genio matemático!\n\nLa respuesta correcta era: *${game.result}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    delete global.mathGames[gameId];
                    return true;
                } else {
                    game.attempts++;
                    await m.react('❌');

                    if (game.attempts >= 2) {
                        await conn.sendMessage(m.chat, {
                            text: `❌ *JUEGO TERMINADO*\n\nSe agotaron los intentos, @${m.sender.split('@')[0]}.\nLa respuesta era: *${game.result}*`,
                            contextInfo: { mentionedJid: [m.sender] }
                        }, { quoted: m });
                        delete global.mathGames[gameId];
                        return true;
                    }

                    const hint = Math.abs(userAns - game.result) < 5
                        ? '¡Estás muy cerca!'
                        : (userAns < game.result ? 'Es un número más alto.' : 'Es un número más bajo.');

                    await conn.sendMessage(m.chat, {
                        text: `❌ *Incorrecto❌ Incorrecto* @${m.sender.split('@')[0]}\n💡 ${hint}\n_Intento ${game.attempts}/2_\n\n📌 *Nota:* Recuerda responder citando el mensaje del reto original.`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                    return true;
                }
            },
            run: async (m, { conn, text, usedPrefix, command }) => {
                global.mathGames = global.mathGames || {};
                const gameId = `${m.chat}-${m.sender}`;

                if (global.mathGames[gameId]) {
                    return conn.sendMessage(m.chat, {
                        text: `⚠️ Ya tienes un reto activo, @${m.sender.split('@')[0]}. Resuelve: *${global.mathGames[gameId].equation}*`,
                        contextInfo: { mentionedJid: [m.sender] }
                    }, { quoted: m });
                }

                const args = text ? text.trim().toLowerCase() : '';

                if (!['bajo', 'medio', 'alto'].includes(args)) {
                    return conn.sendMessage(m.chat, {
                        text: `🧮 *RETO MATEMÁTICO PERSONAL*\n\nSelecciona un nivel de dificultad:\n\n🟢 *${usedPrefix}${command} bajo*\n(Sumas y restas sencillas)\n\n🟡 *${usedPrefix}${command} medio*\n(Operaciones mixtas intermedias)\n\n🔴 *${usedPrefix}${command} alto*\n(Multiplicaciones avanzadas y retos complejos)`
                    }, { quoted: m });
                }

                let op, num1, num2;
                if (args === 'bajo') {
                    const ops = ['+', '-'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = Math.floor(Math.random() * 30) + 1;
                    num2 = Math.floor(Math.random() * 30) + 1;
                } else if (args === 'medio') {
                    const ops = ['+', '-', '*'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = op === '*' ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 100) + 1;
                    num2 = op === '*' ? Math.floor(Math.random() * 12) + 1 : Math.floor(Math.random() * 100) + 1;
                } else {
                    const ops = ['+', '-', '*'];
                    op = ops[Math.floor(Math.random() * ops.length)];
                    num1 = op === '*' ? Math.floor(Math.random() * 30) + 5 : Math.floor(Math.random() * 900) + 100;
                    num2 = op === '*' ? Math.floor(Math.random() * 20) + 5 : Math.floor(Math.random() * 900) + 100;
                }

                const equation = `${num1} ${op} ${num2}`;
                const result = eval(equation);

                const textoReto = `🧮 *RETO MATEMÁTICO - NIVEL ${args.toUpperCase()}*\n\nHola @${m.sender.split('@')[0]}, resuelve:\n\n💡 *${equation}*\n\n_Solo tú puedes responder. Tienes 2 intentos._\n\n📌 *Nota:* Debes responder directamente a este mensaje.`;

                const enviado = await conn.sendMessage(m.chat, {
                    text: textoReto,
                    contextInfo: { mentionedJid: [m.sender] }
                }, { quoted: m });

                global.mathGames[gameId] = { equation, result, attempts: 0, msgId: enviado.key.id };
                return true;
            }
        }
    }
};

export const hangmanCommand = {
    category: 'game',
    commands: {
        ahorcado: {
            name: 'ahorcado',
            alias: ['hangman', 'letra'],
            async before(m, { conn }) {
                global.hangmanGames = global.hangmanGames || {};
                const chatGame = global.hangmanGames[m.chat];
                
                if (!chatGame || chatGame.gameOver || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== chatGame.msgId) return false;

                const letra = normalizeLetra((m.text || '').trim());
                if (letra.length !== 1 || !/^[A-ZÑ]$/.test(letra)) return false;

                const juego = chatGame.estadoJuego;

                if (juego.usadasNorm.includes(letra)) {
                    await m.react('⚠️');
                    return true; 
                }

                juego.usadas.push(letra);
                juego.usadasNorm.push(letra);

                if (juego.palabraNorm.includes(letra)) {
                    for (let i = 0; i < juego.palabra.length; i++) {
                        if (juego.palabraNorm[i] === letra) {
                            juego.oculta[i] = juego.palabra[i];
                        }
                    }
                    if (!juego.oculta.includes('_')) {
                        let imgVictoria = generateHangmanImage({ ...juego, estado: 'ganado' });
                        let winMsg = `*¡VICTORIA! 🎉*\n\nLa palabra era: ${juego.palabra}\nGanador: @${m.sender.split('@')[0]}`;
                        
                        chatGame.gameOver = true;
                        await m.react('✅');
                        await conn.sendMessage(m.chat, { image: imgVictoria, caption: winMsg, mentions: [m.sender] }, { quoted: m });
                        delete global.hangmanGames[m.chat];
                        return true;
                    }
                    
                    let imgAcierto = generateHangmanImage(juego);
                    const aciertoMsg = await conn.sendMessage(m.chat, {
                        image: imgAcierto,
                        caption: `Correcto: ${letra}\nPalabra: ${juego.oculta.join(' ')}\nRestantes: ${juego.maxIntentos - juego.intentos}`
                    }, { quoted: m });
                    
                    chatGame.msgId = aciertoMsg.key.id;
                    await m.react('✅');

                } else {
                    juego.intentos += 1;
                    if (juego.intentos >= juego.maxIntentos) {
                        let imgDerrota = generateHangmanImage({ ...juego, estado: 'perdido' });
                        let loseMsg = `*GAME OVER 💀*\nLa palabra era: ${juego.palabra}`;
                        
                        chatGame.gameOver = true;
                        await m.react('❌');
                        await conn.sendMessage(m.chat, { image: imgDerrota, caption: loseMsg }, { quoted: m });
                        delete global.hangmanGames[m.chat];
                        return true;
                    }
                    
                    let imgFallo = generateHangmanImage(juego);
                    const falloMsg = await conn.sendMessage(m.chat, {
                        image: imgFallo,
                        caption: `Fallo: ${letra} no está.\nVidas: ${juego.maxIntentos - juego.intentos}\nUsadas: ${juego.usadas.join(', ')}`
                    }, { quoted: m });
                    
                    chatGame.msgId = falloMsg.key.id;
                    await m.react('❌');
                }

                return true;
            },
            run: async (m, { conn, text, usedPrefix, command }) => {
                global.hangmanGames = global.hangmanGames || {};
                
                if (global.hangmanGames[m.chat]) {
                    return conn.sendMessage(m.chat, { 
                        text: `*» ALERTA* : Ya hay un juego de ahorcado activo en este chat. Responde al mensaje anterior.` 
                    }, { quoted: m });
                }

                const eleccion = palabras[Math.floor(Math.random() * palabras.length)];
                const nuevoJuego = {
                    palabraOriginal: eleccion.palabra,
                    palabra: eleccion.palabra.toUpperCase(),
                    palabraNorm: normalizePalabra(eleccion.palabra),
                    pista: eleccion.pista,
                    oculta: Array.from(eleccion.palabra).map(() => '_'),
                    intentos: 0,
                    maxIntentos: 6,
                    usadas: [],
                    usadasNorm: []
                };

                let imgInicio = generateHangmanImage(nuevoJuego);
                const enviado = await conn.sendMessage(m.chat, {
                    image: imgInicio,
                    caption: `*SISTEMA DE AHORCADO «*\n\n` +
                              `• *Pista* : ${nuevoJuego.pista}\n` +
                              `• *Palabra* : ${nuevoJuego.oculta.join(' ')}\n\n` +
                              `• *Vidas* : ${nuevoJuego.maxIntentos}\n\n` +
                              `• Responde directamente a este mensaje con una letra para jugar.`
                }, { quoted: m });

                global.hangmanGames[m.chat] = { 
                    msgId: enviado.key.id, 
                    estadoJuego: nuevoJuego,
                    gameOver: false
                };
                
                return true;
            }
        }
    }
};
