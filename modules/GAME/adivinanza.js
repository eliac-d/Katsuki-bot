const data = [
  { p: "Si me nombras, desaparezco. ¿Qué soy?", r: ["EL SILENCIO", "SILENCIO"] },
  { p: "Vuelo sin alas, lloro sin ojos. ¿Qué soy?", r: ["LA NUBE", "NUBE", "LAS NUBES", "NUBES"] },
  { p: "Tengo ciudades pero no casas, montañas pero no árboles, y ríos pero no agua. ¿Qué soy?", r: ["UN MAPA", "MAPA", "EL MAPA"] },
  { p: "Siempre estoy en camino, pero nunca llego. ¿Qué soy?", r: ["EL MAÑANA", "MAÑANA", "EL FUTURO", "FUTURO"] },
  { p: "Cuanto más hay, menos ves. ¿Qué soy?", r: ["LA OSCURIDAD", "OSCURIDAD"] },
  { p: "Paso por el agua y no me mojo, paso por el fuego y no me quemo. ¿Qué soy?", r: ["LA SOMBRA", "SOMBRA"] },
  { p: "No tengo voz, pero te hablo. No tengo alma, pero te enseño. ¿Qué soy?", r: ["UN LIBRO", "LIBRO", "EL LIBRO"] },
  { p: "Rompo al decir mi nombre. ¿Qué soy?", r: ["EL SILENCIO", "SILENCIO"] },
  { p: "Me puedes sostener en tu mano derecha, pero jamás en tu mano izquierda. ¿Qué soy?", r: ["TU CODO IZQUIERDO", "CODO IZQUIERDO", "EL CODO IZQUIERDO"] },
  { p: "Nazco grande y muero pequeña. ¿Qué soy?", r: ["UNA VELA", "VELA", "LA VELA"] },
  { p: "Te pertenezco a ti, pero los demás lo usan mucho más que tú. ¿Qué es?", r: ["TU NOMBRE", "NOMBRE", "EL NOMBRE"] },
  { p: "Tengo un solo ojo, pero no puedo ver nada. ¿Qué soy?", r: ["UNA AGUJA", "AGUJA", "LA AGUJA"] },
  { p: "Tengo llaves pero no abro cerrojos, tengo espacio pero no hay cuartos, puedo entrar pero no salir. ¿Qué soy?", r: ["UN TECLADO", "TECLADO", "EL TECLADO"] },
  { p: "Corro pero no tengo piernas, murmuro pero no tengo boca. ¿Qué soy?", r: ["UN RIO", "RIO", "EL RIO", "UN RÍO", "RÍO", "EL RÍO"] },
  { p: "Subo y bajo, pero me quedo en el mismo lugar. ¿Qué soy?", r: ["LA ESCALERA", "ESCALERA", "LAS ESCALERAS", "ESCALERAS", "UNA ESCALERA"] },
  { p: "Puedo viajar por todo el mundo sin salir de mi esquina. ¿Qué soy?", r: ["UN SELLO", "SELLO", "EL SELLO", "ESTAMPILLA", "UNA ESTAMPILLA"] },
  { p: "No me puedes comprar ni vender, pero si me pierdes no me puedes recuperar. ¿Qué soy?", r: ["EL TIEMPO", "TIEMPO"] },
  { p: "Tengo un cuello pero no tengo cabeza. ¿Qué soy?", r: ["UNA BOTELLA", "BOTELLA", "LA BOTELLA"] },
  { p: "Mientras más caliente me pongo, más fresco parezco. ¿Qué soy?", r: ["EL PAN", "PAN", "UN PAN"] },
  { p: "Si me tienes, quieres compartirme. Si me compartes, ya no me tienes. ¿Qué soy?", r: ["UN SECRETO", "SECRETO", "EL SECRETO"] },
  { p: "Llego sin ser visto, me voy sin ser tocado, y a veces asusto sin haber hablado. ¿Qué soy?", r: ["EL VIENTO", "VIENTO"] },
  { p: "Aunque tengo muchos dientes, nunca puedo morder. ¿Qué soy?", r: ["UN PEINE", "PEINE", "EL PEINE"] },
  { p: "Entro seco y duro, pero salgo blando y mojado. ¿Qué soy?", r: ["EL CHICLE", "CHICLE", "UN CHICLE"] },
  { p: "Parezco un instrumento pero marco el compás de tus días. Si me detengo, nadie camina igual. ¿Qué soy?", r: ["EL RELOJ", "RELOJ", "UN RELOJ"] },
  { p: "Llevo años en el mar y nunca aprendí a nadar. ¿Qué soy?", r: ["UN ANCLA", "ANCLA", "EL ANCLA"] },
  { p: "Tengo orejas pero no oigo, tengo hojas pero no soy árbol. ¿Qué soy?", r: ["EL CUADERNO", "CUADERNO", "UN CUADERNO", "EL LIBRO"] },
  { p: "Me miras pero no me ves, me escuchas pero no me oyes, cambio de forma sin moverme. ¿Qué soy?", r: ["EL AIRE", "AIRE"] },
  { p: "Si me alimentas, vivo; si me das de beber, muero. ¿Qué soy?", r: ["EL FUEGO", "FUEGO", "UN FUEGO"] },
  { p: "Vuelo de noche, me escondo de día y nunca verás plumas en la ala mía. ¿Qué soy?", r: ["EL MURCIÉLAGO", "MURCIÉLAGO", "UN MURCIELAGO", "MURCIELAGO"] },
  { p: "Cuanto más le quitas, más grande se vuelve. ¿Qué soy?", r: ["UN HOYO", "HOYO", "UN AGUJERO", "AGUJERO", "EL AGUJERO"] },
  { p: "Tengo caja pero no soy joyero, tengo agujas pero no coso. ¿Qué soy?", r: ["LA BRÚJULA", "BRÚJULA", "LA BRUJULAY", "BRUJULA"] },
  { p: "Tengo copa y no soy para beber, tengo alas y no puedo volar. ¿Qué soy?", r: ["UN ÁRBOL", "ARBOL", "ÁRBOL", "EL ARBOL"] },
  { p: "Soy alto de joven y bajo de viejo, brillo con fuego y muero entre humo. ¿Qué soy?", r: ["UNA VELA", "VELA", "LA VELA", "UN CIRIO", "CIRIO"] },
  { p: "Subo pero nunca bajo. ¿Qué soy?", r: ["LA EDAD", "EDAD", "TU EDAD"] },
  { p: "Tengo piel pero no soy animal, tengo gajos pero no soy mandarina. ¿Qué soy?", r: ["EL AJO", "AJO", "UN AJO"] },
  { p: "Blanca por dentro, verde por fuera. Si quieres que te lo diga, espera. ¿Qué soy?", r: ["LA PERA", "PERA", "UNA PERA"] },
  { p: "Oro parece, plata no es. El que no lo adivine, bien tonto es. ¿Qué soy?", r: ["EL PLÁTANO", "PLATANO", "EL PLATANO", "PLÁTANO"] },
  { p: "Cien damas en un camino, no hacen polvo ni remolino. ¿Qué son?", r: ["LAS HORMIGAS", "HORMIGAS", "LAS HORMIGA"] },
  { p: "Llevo mi casa a cuestas, camino sin tener patas y dejo un hilo de plata. ¿Qué soy?", r: ["EL CARACOL", "CARACOL", "UN CARACOL"] },
  { p: "Tengo capas pero no soy cebolla, doy calor pero no soy estufa. ¿Qué soy?", r: ["EL ABRIGO", "ABRIGO", "UN ABRIGO"] },
  { p: "Me mojas para usarme, me frotas para limpiar y desaparezco con el agua. ¿Qué soy?", r: ["EL JABÓN", "JABÓN", "JABON", "EL JABON"] },
  { p: "Cuanto más seco, más húmedo me vuelvo. ¿Qué soy?", r: ["LA TOALLA", "TOALLA", "UNA TOALLA"] },
  { p: "Te veo cuando me miras, pero no puedo hablarte. Imito tus gestos al instante. ¿Qué soy?", r: ["EL ESPEJO", "ESPEJO", "UN ESPEJO"] },
  { p: "Tengo patas pero no puedo caminar, sostengo la comida pero no puedo comer. ¿Qué soy?", r: ["LA MESA", "MESA", "UNA MESA"] },
  { p: "Tengo dientes y no muerdo, guardo llaves y no abro, me llevas en el bolsillo. ¿Qué soy?", r: ["LA CREMALLERA", "CREMALLERA", "EL CIERRE", "CIERRE"] },
  { p: "Nací en el mar, fui blanco como la nieve y ahora condimento tu mesa. ¿Qué soy?", r: ["LA SAL", "SAL"] },
  { p: "Tengo raíces que nadie ve, soy más alta que los árboles, pero nunca crezco. ¿Qué soy?", r: ["LA MONTAÑA", "MONTAÑA", "UNA MONTAÑA"] },
  { p: "Tengo barba pero no cara, tengo granos pero no soy piel. ¿Qué soy?", r: ["EL ELOTE", "ELOTE", "EL MAÍZ", "MAIZ", "MAÍZ"] },
  { p: "Siempre miro hacia el sol y sigo su camino todo el día. ¿Qué soy?", r: ["EL GIRASOL", "GIRASOL", "UN GIRASOL"] },
  { p: "Caigo de un edificio y no me rompo, caigo al agua y me deshago. ¿Qué soy?", r: ["EL PAPEL", "PAPEL", "UN PAPEL"] },
  { p: "Tengo tronco pero no soy árbol, tengo lomo pero no soy animal. ¿Qué soy?", r: ["EL LIBRO", "LIBRO"] },
  { p: "Te cubro la cabeza del sol y de la lluvia, pero no tengo cuerpo. ¿Qué soy?", r: ["EL SOMBRERO", "SOMBRERO", "UN SOMBRERO", "LA GORRA", "GORRA"] },
  { p: "Salgo de noche, muero de día, cambio de forma constantemente. ¿Qué soy?", r: ["LA LUNA", "LUNA"] },
  { p: "Miles de luces brillan en el cielo nocturno pero nadie las enciende. ¿Qué son?", r: ["LAS ESTRELLAS", "ESTRELLAS", "LAS ESTRELLA"] },
  { p: "Si me rompes, me usas; si me dejas entero, no sirvo. ¿Qué soy?", r: ["EL HUEVO", "HUEVO", "UN HUEVO"] },
  { p: "Tengo forma de corazón y soy roja con pequeñas semillas por fuera. ¿Qué soy?", r: ["LA FRESA", "FRESA", "UNA FRESA"] },
  { p: "En la mesa me ponen, me cortan pero nadie me come. ¿Qué soy?", r: ["LA BARAJA", "BARAJA", "LAS CARTAS", "CARTAS"] },
  { p: "Me abres cuando llueve y me cierras cuando escampa. ¿Qué soy?", r: ["EL PARAGUAS", "PARAGUAS", "EL SOMBRILLA", "SOMBRILLA"] },
  { p: "Si me tocas, me rompo. Si me miras, existo. Si me cierras los ojos, aparezco. ¿Qué soy?", r: ["EL SUEÑO", "SUEÑO", "UN SUEÑO"] },
  { p: "Tengo agujeros por todos lados, pero aun así puedo sostener agua. ¿Qué soy?", r: ["LA ESPONJA", "ESPONJA", "UNA ESPONJA"] },
  { p: "Tengo dos manos pero no tengo brazos, tengo cara pero no tengo ojos. ¿Qué soy?", r: ["EL RELOJ", "RELOJ"] },
  { p: "Hablo todos los idiomas del mundo pero no tengo boca. Te devuelvo lo que dices. ¿Qué soy?", r: ["EL ECO", "ECO", "UN ECO"] },
  { p: "Doy vueltas sin parar, pero nunca me muevo del sitio. ¿Qué soy?", r: ["EL VENTILADOR", "VENTILADOR", "UN VENTILADOR"] },
  { p: "Tengo botones pero no soy camisa, tengo pantalla pero no soy televisión. ¿Qué soy?", r: ["EL CELULAR", "CELULAR", "EL TELÉFONO", "TELEFONO", "TELÉFONO"] },
  { p: "Tengo pico pero no soy ave, tengo cabo pero no soy barco. ¿Qué soy?", r: ["EL PICO", "PICO", "UNA PIQUETA"] },
  { p: "Si me buscas estoy en el fuego, pero nunca me quemas. ¿Qué soy?", r: ["LA LETRA E", "LETRA E", "LA E", "E"] },
  { p: "Tengo cuatro patas pero no puedo andar, me usas para comer. ¿Qué soy?", r: ["LA SILLA", "SILLA", "UNA SILLA"] },
  { p: "Me compras para comer, pero jamás me comes. ¿Qué soy?", r: ["EL PLATO", "PLATO", "EL CUCHILLO", "LA CUCHARA"] },
  { p: "Entro a la cocina bailando y salgo quemado. ¿Qué soy?", r: ["EL MAÍZ PALOMERO", "PALOMITAS", "LAS PALOMITAS", "PALOMITAS DE MAIZ"] },
  { p: "Tengo ojos pero no veo, tengo piel pero no me visto, nazco bajo la tierra. ¿Qué soy?", r: ["LA PAPA", "PAPA", "LA PATATA", "PATATA"] },
  { p: "Tengo hojas pero no soy planta, tengo espina pero no soy pez. ¿Qué soy?", r: ["EL LIBRO", "LIBRO"] },
  { p: "Verde fue mi nacimiento, amarillo mi vivir, y negro me estoy poniendo cuando me voy a morir. ¿Qué soy?", r: ["EL PLÁTANO", "PLATANO", "PLÁTANO", "EL PLATANO"] },
  { p: "Tengo cuerpo de madera y corazón de carbón, me usas para escribir. ¿Qué soy?", r: ["EL LÁPIZ", "LÁPIZ", "LAPIZ", "EL LAPIZ"] },
  { p: "Camino sin pies, vuelo sin alas, canto sin boca. ¿Qué soy?", r: ["EL VIENTO", "VIENTO"] },
  { p: "Soy redonda como el mundo, dulce como la miel y me comen en verano. ¿Qué soy?", r: ["LA SANDÍA", "SANDÍA", "SANDIA", "LA SANDIA"] },
  { p: "Pico pero no tengo boca, soy rojo o verde y a muchos hago llorar. ¿Qué soy?", r: ["EL CHILE", "CHILE", "EL AJÍ", "AJI"] },
  { p: "Tengo mil agujas pero no sé coser, no soy costurera pero pincho bien. ¿Qué soy?", r: ["EL PUERCOESPÍN", "PUERCOESPÍN", "PUERCOESPIN", "EL ERIZO", "ERIZO"] },
  { p: "Viene de noche y se va de día, llena la casa si está encendida. ¿Qué soy?", r: ["LA LUZ", "LUZ", "LA BOMBILLA", "FOCO"] },
  { p: "Tengo llaves pero no candados, toco notas pero no escribo cartas. ¿Qué soy?", r: ["EL PIANO", "PIANO", "UN PIANO"] },
  { p: "Tengo plumas pero no vuelo, tengo tinta pero no dibujo solo. ¿Qué soy?", r: ["LA PLUMAFUENTE", "PLUMA", "LA PLUMA", "EL BOLÍGRAFO", "BOLIGRAFO"] },
  { p: "Subo llena y bajo vacía, me meten en la boca varias veces al día. ¿Qué soy?", r: ["LA CUCHARA", "CUCHARA", "UNA CUCHARA"] },
  { p: "Si me mojas te limpio, si me usas mucho me hago pequeño. ¿Qué soy?", r: ["EL JABÓN", "JABÓN", "JABON"] },
  { p: "Tengo cables pero no soy coche, doy luz pero no soy sol. ¿Qué soy?", r: ["LA LÁMPARA", "LÁMPARA", "LAMPARA", "EL FOCO"] },
  { p: "Te sigo a todas partes bajo el sol, pero desaparezco en la noche. ¿Qué soy?", r: ["LA SOMBRA", "SOMBRA"] },
  { p: "Tengo un arco pero no tiro flechas, salgo después de la lluvia. ¿Qué soy?", r: ["EL ARCOÍRIS", "ARCOÍRIS", "ARCOIRIS", "EL ARCOIRIS"] },
  { p: "Tengo ruedas pero no motor, me pedaleas con vigor. ¿Qué soy?", r: ["LA BICICLETA", "BICICLETA", "UNA BICICLETA"] },
  { p: "Fría como el hielo, blanca como la leche, caigo del cielo en invierno. ¿Qué soy?", r: ["LA NIEVE", "NIEVE"] },
  { p: "No tengo vida pero puedo morir si no me me cargas la energía. ¿Qué soy?", r: ["LA BATERÍA", "BATERÍA", "BATERIA", "EL CELULAR"] },
  { p: "Vuelo sin motor, hablo sin voz, si me sueltas me pierdo en las nubes. ¿Qué soy?", r: ["EL GLOBO", "GLOBO", "UN GLOBO"] },
  { p: "Protejo tus pies cada día, tengo suela pero no soy zapato entero. ¿Qué soy?", r: ["EL CALCETÍN", "CALCETIN", "CALCETÍN", "MEDIA", "LAS MEDIAS"] },
  { p: "Tengo marco pero no soy puerta, tengo cristal pero no soy ventana. ¿Qué soy?", r: ["EL CUADRO", "CUADRO", "UN CUADRO", "EL RETRATO"] },
  { p: "Nací en la tierra, me muelen con fe, me tomas bien caliente por la mañana. ¿Qué soy?", r: ["EL CAFÉ", "CAFÉ", "CAFE", "EL CAFE"] },
  { p: "Tengo cunas pero no duermo a bebés, llevo frutas a los mercados. ¿Qué soy?", r: ["LA CAJA", "CAJA", "EL HUACAL"] },
  { p: "Tengo cola y no soy perro, me elevo al viento si me tiras del hilo. ¿Qué soy?", r: ["LA COMETA", "COMETA", "EL PAPALOTE", "PAPALOTE"] },
  { p: "Redondo, redondo, como un queso, y nadie me da un beso. ¿Qué soy?", r: ["EL SOL", "SOL"] },
  { p: "Aunque esté lleno de agujeros, guardo agua y no la tiro. ¿Qué soy?", r: ["LA ESPONJA", "ESPONJA"] },
  { p: "Te tomo la foto sin cámara, guardo tus recuerdos sin papel. ¿Qué soy?", r: ["LA MENTE", "MENTE", "EL CEREBRO", "CEREBRO"] },
  { p: "Nací verde, me vestí de amarillo y morí quemado en el plato. ¿Qué soy?", r: ["EL PLÁTANO FRITO", "PLATANO", "EL PLATANO", "PLÁTANO"] },
  { p: "Llevo a la gente arriba y abajo sin mover mis escalones. ¿Qué soy?", r: ["EL ASCENSOR", "ASCENSOR", "EL ELEVADOR", "ELEVADOR"] },
  { p: "Vivo en el agua, no soy pez, llevo mi casa a cuestas donde me ves. ¿Qué soy?", r: ["LA TORTUGA", "TORTUGA", "UNA TORTUGA"] }
];

const correctMsgs = [
  "¡Impresionante! Le diste justo en el blanco.",
  "¡Eso es! Tu inteligencia no deja de sorprender.",
  "¡Correcto! Sabía que tenías la respuesta.",
  "¡Excelente deducción! Has resuelto el acertijo."
];

const wrongMsgs = [
  "Esa no es la respuesta. ¡Sigue intentando!",
  "Mmm... cerca pero no. Inténtalo otra vez.",
  "Respuesta incorrecta. No te rindas.",
  "¡Negativo! Piensa un poco más."
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

const cleanText = (text) => {
    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9 ]/g, "")
        .trim()
        .toUpperCase();
};

export const adivinanzaCommand = {
    category: 'game',
    commands: {
        adivinanza: {
            name: 'adivinanza',
            alias: ['riddle', 'acertijo'],
            async before(m, { conn }) {
                global.riddleGames = global.riddleGames || {};
                const gameId = `${m.chat}-${m.sender}`;
                const game = global.riddleGames[gameId];
                if (!game || m.isBaileys || m.fromMe) return false;

                const userTextClean = cleanText(m.text || '');
                if (!userTextClean) return false;

                const isCorrect = game.respuestasValidas.some(res => cleanText(res) === userTextClean);

                if (isCorrect) {
                    await conn.sendMessage(m.chat, {
                        text: `♛ *ADIVINANZA RESUELTA* ♛\n\n` +
                              `➤ ${getRandom(correctMsgs)}\n` +
                              `✍ *Solución* : ${game.solucionPrincipal}`
                    }, { quoted: m });
                    delete global.riddleGames[gameId];
                    return true;
                }

                game.intentos -= 1;

                if (game.intentos > 0) {
                    await conn.sendMessage(m.chat, {
                        text: `✘ *RESPUESTA INCORRECTA* ✘\n\n` +
                              `➤ ${getRandom(wrongMsgs)}\n` +
                              `✰ *Intentos restantes* : ${game.intentos}\n\n` +
                              `➔ Escribe tu siguiente respuesta.`
                    }, { quoted: m });
                } else {
                    await conn.sendMessage(m.chat, {
                        text: `𖤍 *JUEGO TERMINADO* 𖤍\n\n` +
                              `➤ Agotaste tus 3 intentos.\n` +
                              `✍ *Solución Correcta* : ${game.solucionPrincipal}`
                    }, { quoted: m });
                    delete global.riddleGames[gameId];
                }

                return true;
            },
            run: async (m, { conn }) => {
                global.riddleGames = global.riddleGames || {};
                global.usedRiddleIndices = global.usedRiddleIndices || [];
                
                const gameId = `${m.chat}-${m.sender}`;

                if (global.riddleGames[gameId]) {
                    return conn.sendMessage(m.chat, { 
                        text: `⍰ *ATENCIÓN* : Ya tienes una adivinanza activa. Escribe tu respuesta directamente.` 
                    }, { quoted: m });
                }

                if (global.usedRiddleIndices.length >= data.length) {
                    global.usedRiddleIndices = [];
                }

                let randomIndex;
                do {
                    randomIndex = Math.floor(Math.random() * data.length);
                } while (global.usedRiddleIndices.includes(randomIndex));

                global.usedRiddleIndices.push(randomIndex);
                const reto = data[randomIndex];

                const texto = `𖤍 *RETO DE ADIVINANZA* 𖤍\n\n` +
                              `➤ *Pregunta* : ${reto.p}\n\n` +
                              `✍ Escribe tu respuesta directamente en el chat.\n` +
                              `✰ Tienes *3 intentos*.`;

                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                const respuestasArray = Array.isArray(reto.r) ? reto.r : [reto.r];

                global.riddleGames[gameId] = { 
                    respuestasValidas: respuestasArray, 
                    solucionPrincipal: respuestasArray[0],
                    intentos: 3, 
                    msgId: enviado.key.id 
                };
                return true;
            }
        }
    }
};
