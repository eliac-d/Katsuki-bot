import { createCanvas } from '@napi-rs/canvas';

const questions = [
    {
        question: '¿Cómo se llama el muñeco poseído en la saga de películas "Child\'s Play"?',
        options: ['A) Annabelle', 'B) Chucky', 'C) Billy', 'D) Slappy'],
        answer: 'B'
    },
    {
        question: '¿Qué máscara lleva el asesino en la película "Scream"?',
        options: ['A) Máscara de Hockey', 'B) Ghostface', 'C) Máscara de Cerdo', 'D) Máscara de Payaso'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el nombre del demonio principal en la película "El Exorcista"?',
        options: ['A) Pazuzu', 'B) Azazel', 'C) Valak', 'D) Balthazar'],
        answer: 'A'
    },
    {
        question: '¿Cómo se llama la entidad o payaso aterrador en la novela "It" de Stephen King?',
        options: ['A) Pennywise', 'B) Art the Clown', 'C) Twisty', 'D) Bozo'],
        answer: 'A'
    },
    {
        question: '¿En qué calle ocurren los asesinatos provocados por Freddy Krueger?',
        options: ['A) Baker Street', 'B) Elm Street', 'C) Ocean Drive', 'D) Crystal Lake'],
        answer: 'B'
    },
    {
        question: '¿Qué objeto poseído causa los eventos en la saga de "El Conjuro"?',
        options: ['A) Un espejo', 'B) La muñeca Annabelle', 'C) Una caja musical', 'D) Un libro antiguo'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el nombre de la criatura legendaria del folclore hispano que lamenta la pérdida de sus hijos?',
        options: ['A) La Sayona', 'B) La Llorona', 'C) La Cihuacóatl', 'D) La Umbría'],
        answer: 'B'
    },
    {
        question: '¿Qué asesino en serie del cine de terror usa una máscara de piel humana y una motosierra?',
        options: ['A) Jason Voorhees', 'B) Leatherface', 'C) Michael Myers', 'D) Pinhead'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el nombre del hotel embrujado donde se desarrolla la historia de "El Resplandor"?',
        options: ['A) Hotel Overlook', 'B) Hotel Bates', 'C) Hotel Cortez', 'D) Hotel Dolphin'],
        answer: 'A'
    },
    {
        question: '¿Qué condición deben cumplir las víctimas en la película "El Aro" (The Ring) para evitar morir tras ver la cinta?',
        options: ['A) Quemar el videocasete', 'B) Hacer una copia y mostrársela a alguien más', 'C) Destruir el televisor', 'D) Rezar en un altar'],
        answer: 'B'
    },
    {
        question: '¿De qué país es originaria la festividad de Halloween?',
        options: ['A) Estados Unidos', 'B) Irlanda', 'C) México', 'D) Inglaterra'],
        answer: 'B'
    },
    {
        question: '¿Qué fruta se utilizaba originalmente para hacer linternas antes de las calabazas?',
        options: ['A) Manzana', 'B) Sandía', 'C) Nabo', 'D) Melón'],
        answer: 'C'
    },
    {
        question: '¿Cómo se llama el personaje principal de la película "El extraño mundo de Jack"?',
        options: ['A) Jack Skellington', 'B) Jack O\'Lantern', 'C) Victor Van Dort', 'D) Oogie Boogie'],
        answer: 'A'
    },
    {
        question: '¿Qué ser mitológico cambia de forma humana a lobo durante la luna llena?',
        options: ['A) Vampiro', 'B) Licántropo', 'C) Wendigo', 'D) Ghoul'],
        answer: 'B'
    },
    {
        question: '¿Cuál es la fobia o miedo irracional al número 13?',
        options: ['A) Aracnofobia', 'B) Claustrofobia', 'C) Triscaidecafobia', 'D) Fotofobia'],
        answer: 'C'
    },
    {
        question: '¿Cuál es el planeta más grande del sistema solar?',
        options: ['A) Marte', 'B) Júpiter', 'C) Saturno', 'D) Neptuno'],
        answer: 'B'
    },
    {
        question: '¿En qué año llegó el hombre a la Luna?',
        options: ['A) 1965', 'B) 1969', 'C) 1972', 'D) 1959'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el elemento químico con el símbolo "Au"?',
        options: ['A) Plata', 'B) Aluminio', 'C) Oro', 'D) Cobre'],
        answer: 'C'
    },
    {
        question: '¿Quién pintó la Mona Lisa?',
        options: ['A) Vincent van Gogh', 'B) Leonardo da Vinci', 'C) Pablo Picasso', 'D) Michelangelo'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el océano más grande de la Tierra?',
        options: ['A) Atlántico', 'B) Índico', 'C) Pacífico', 'D) Ártico'],
        answer: 'C'
    },
    {
        question: '¿Qué gas respiran principalmente las plantas durante la fotosíntesis?',
        options: ['A) Oxígeno', 'B) Dióxido de carbono', 'C) Nitrógeno', 'D) Hidrógeno'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el país con mayor territorio en el mundo?',
        options: ['A) Canadá', 'B) China', 'C) Rusia', 'D) Estados Unidos'],
        answer: 'C'
    },
    {
        question: '¿En qué continente se encuentra el desierto del Sahara?',
        options: ['A) Asia', 'B) América', 'C) África', 'D) Oceanía'],
        answer: 'C'
    },
    {
        question: '¿Cuántos huesos tiene el cuerpo humano adulto?',
        options: ['A) 206', 'B) 210', 'C) 300', 'D) 198'],
        answer: 'A'
    },
    {
        question: '¿Cuál es la velocidad de la luz aproximadamente en el vacío?',
        options: ['A) 150,000 km/s', 'B) 300,000 km/s', 'C) 500,000 km/s', 'D) 1,000,000 km/s'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el río más largo del mundo?',
        options: ['A) Amazonas', 'B) Nilo', 'C) Misisipi', 'D) Yangtze'],
        answer: 'A'
    },
    {
        question: '¿Quién escribió la obra "Cien años de soledad"?',
        options: ['A) Mario Vargas Llosa', 'B) Gabriel García Márquez', 'C) Julio Cortázar', 'D) Jorge Luis Borges'],
        answer: 'B'
    },
    {
        question: '¿En qué año cayó el Muro de Berlín?',
        options: ['A) 1985', 'B) 1991', 'C) 1989', 'D) 1979'],
        answer: 'C'
    },
    {
        question: '¿Cuál es el metal más abundante en la corteza terrestre?',
        options: ['A) Hierro', 'B) Aluminio', 'C) Cobre', 'D) Titanio'],
        answer: 'B'
    },
    {
        question: '¿Qué animal es conocido tradicionalmente como el "rey de la selva"?',
        options: ['A) León', 'B) Tigre', 'C) Elefante', 'D) Gorila'],
        answer: 'A'
    },
    {
        question: '¿Cuál es la capital de Japón?',
        options: ['A) Tokio', 'B) Kioto', 'C) Osaka', 'D) Seúl'],
        answer: 'A'
    },
    {
        question: '¿Qué instrumento musical tiene teclas, martillos y cuerdas?',
        options: ['A) Guitarra', 'B) Violín', 'C) Piano', 'D) Acordeón'],
        answer: 'C'
    },
    {
        question: '¿Cuál es la montaña más alta sobre el nivel del mar?',
        options: ['A) Monte Everest', 'B) K2', 'C) Kangchenjunga', 'D) Kilimanjaro'],
        answer: 'A'
    },
    {
        question: '¿Quién fue el primer presidente de los Estados Unidos?',
        options: ['A) Thomas Jefferson', 'B) George Washington', 'C) Abraham Lincoln', 'D) John Adams'],
        answer: 'B'
    },
    {
        question: '¿Qué científico formuló la teoría de la relatividad?',
        options: ['A) Isaac Newton', 'B) Nikola Tesla', 'C) Albert Einstein', 'D) Niels Bohr'],
        answer: 'C'
    },
    {
        question: '¿Cuál es la capital de Francia?',
        options: ['A) Lyon', 'B) París', 'C) Marsella', 'D) Burdeos'],
        answer: 'B'
    },
    {
        question: '¿Qué órgano del cuerpo humano se encarga de bombear sangre a todo el organismo?',
        options: ['A) Corazón', 'B) Pulmón', 'C) Hígado', 'D) Cerebro'],
        answer: 'A'
    },
    {
        question: '¿En qué país se encuentran las famosas Pirámides de Guiza?',
        options: ['A) Grecia', 'B) Egipto', 'C) México', 'D) Perú'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el libro más traducido de la literatura española?',
        options: ['A) Don Quijote de la Mancha', 'B) La Celestina', 'C) Cien años de soledad', 'D) El Aleph'],
        answer: 'A'
    },
    {
        question: '¿Qué elemento químico representa la letra "H" en la tabla periódica?',
        options: ['A) Helio', 'B) Hierro', 'C) Mercurio', 'D) Hidrógeno'],
        answer: 'D'
    },
    {
        question: '¿Cuál es el animal terrestre más veloz del mundo?',
        options: ['A) León', 'B) Guepardo', 'C) Antílope', 'D) Galgo'],
        answer: 'B'
    },
    {
        question: '¿En qué año comenzó la Segunda Guerra Mundial?',
        options: ['A) 1914', 'B) 1939', 'C) 1945', 'D) 1929'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el idioma más hablado en el mundo por número de hablantes nativos?',
        options: ['A) Chino mandarín', 'B) Inglés', 'C) Español', 'D) Hindi'],
        answer: 'A'
    },
    {
        question: '¿Quién pintó la bóveda de la Capilla Sixtina?',
        options: ['A) Rafael', 'B) Leonardo da Vinci', 'C) Miguel Ángel', 'D) Donatello'],
        answer: 'C'
    },
    {
        question: '¿Cuál es el lugar más frío de la Tierra registrado históricamente?',
        options: ['A) Groenlandia', 'B) La Antártida', 'C) Siberia', 'D) Alaska'],
        answer: 'B'
    },
    {
        question: '¿Qué gas es indispensable para la respiración humana?',
        options: ['A) Oxígeno', 'B) Dióxido de carbono', 'C) Helio', 'D) Metano'],
        answer: 'A'
    },
    {
        question: '¿Cuál es la capital de Italia?',
        options: ['A) Milán', 'B) Venecia', 'C) Florencia', 'D) Roma'],
        answer: 'D'
    },
    {
        question: '¿Quién escribió la famosa tragedia "Romeo y Julieta"?',
        options: ['A) William Shakespeare', 'B) Charles Dickens', 'C) Oscar Wilde', 'D) Miguel de Cervantes'],
        answer: 'A'
    },
    {
        question: '¿En qué país surgió la invención del fútbol moderno?',
        options: ['A) Brasil', 'B) Alemania', 'C) Inglaterra', 'D) Francia'],
        answer: 'C'
    },
    {
        question: '¿Qué planeta de nuestro sistema solar es conocido como el "Planeta Rojo"?',
        options: ['A) Venus', 'B) Marte', 'C) Júpiter', 'D) Mercurio'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el mamífero de mayor tamaño en el planeta Tierra?',
        options: ['A) Elefante africano', 'B) Ballena azul', 'C) Tiburón ballena', 'D) Jirafa'],
        answer: 'B'
    },
    {
        question: '¿Cuántos días tiene un año bisiesto?',
        options: ['A) 365', 'B) 364', 'C) 366', 'D) 367'],
        answer: 'C'
    },
    {
        question: '¿En qué año terminó la Primera Guerra Mundial?',
        options: ['A) 1914', 'B) 1918', 'C) 1920', 'D) 1939'],
        answer: 'B'
    },
    {
        question: '¿Cuál es la capital de España?',
        options: ['A) Madrid', 'B) Barcelona', 'C) Sevilla', 'D) Valencia'],
        answer: 'A'
    },
    {
        question: '¿Qué médico y científico británico descubrió la penicilina?',
        options: ['A) Louis Pasteur', 'B) Robert Koch', 'C) Edward Jenner', 'D) Alexander Fleming'],
        answer: 'D'
    },
    {
        question: '¿Cuál es la moneda oficial de Japón?',
        options: ['A) Won', 'B) Yuan', 'C) Yen', 'D) Baht'],
        answer: 'C'
    },
    {
        question: '¿Qué sistema del cuerpo humano se encarga de dar soporte estructural e intervienen las articulaciones?',
        options: ['A) Sistema nervioso', 'B) Sistema óseo', 'C) Sistema digestivo', 'D) Sistema endocrino'],
        answer: 'B'
    },
    {
        question: '¿Cuál es la capital de Australia?',
        options: ['A) Sídney', 'B) Canberra', 'C) Melbourne', 'D) Brisbane'],
        answer: 'B'
    },
    {
        question: '¿Quién compuso la famosa Quinta Sinfonía?',
        options: ['A) Ludwig van Beethoven', 'B) Wolfgang Amadeus Mozart', 'C) Johann Sebastian Bach', 'D) Frédéric Chopin'],
        answer: 'A'
    },
    {
        question: '¿En qué continente se localiza geográficamente Brasil?',
        options: ['A) África', 'B) Europa', 'C) América del Sur', 'D) Asia'],
        answer: 'C'
    },
    {
        question: '¿A qué clase de vertebrados pertenecen los delfines y ballenas?',
        options: ['A) Peces', 'B) Mamíferos', 'C) Anfibios', 'D) Reptiles'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el país más poblado del mundo actualmente?',
        options: ['A) India', 'B) China', 'C) Estados Unidos', 'D) Indonesia'],
        answer: 'A'
    },
    {
        question: '¿Qué invención clave perfeccionó y patentó Thomas Edison en 1879?',
        options: ['A) El teléfono', 'B) La radio', 'C) La bombilla incandescente', 'D) El motor a vapor'],
        answer: 'C'
    },
    {
        question: '¿Cómo se llama el proceso biológico por el que las plantas verdes sintetizan su alimento?',
        options: ['A) Fotosíntesis', 'B) Respiración celular', 'C) Mitosis', 'D) Fermentación'],
        answer: 'A'
    },
    {
        question: '¿Cuál es el lago más profundo del planeta?',
        options: ['A) Lago Superior', 'B) Lago Victoria', 'C) Mar Caspio', 'D) Lago Baikal'],
        answer: 'D'
    },
    {
        question: '¿Qué país europeo destaca por su mapa geográfico en forma de bota?',
        options: ['A) Italia', 'B) Grecia', 'C) Portugal', 'D) España'],
        answer: 'A'
    },
    {
        question: '¿Qué tipo de triángulo tiene sus tres lados con la misma longitud?',
        options: ['A) Isósceles', 'B) Equilátero', 'C) Escaleno', 'D) Rectángulo'],
        answer: 'B'
    },
    {
        question: '¿Quién es considerado el autor universal de "Don Quijote de la Mancha"?',
        options: ['A) Francisco de Quevedo', 'B) Miguel de Cervantes', 'C) Lope de Vega', 'D) Calderón de la Barca'],
        answer: 'B'
    },
    {
        question: '¿Qué insecto volador es indispensable para producir miel en las colmenas?',
        options: ['A) Avispa', 'B) Hormiga', 'C) Abeja', 'D) Mariposa'],
        answer: 'C'
    },
    {
        question: '¿En qué siglo dio inicio la Revolución Francesa (1789)?',
        options: ['A) Siglo XVII', 'B) Siglo XVIII', 'C) Siglo XIX', 'D) Siglo XVI'],
        answer: 'B'
    },
    {
        question: '¿Cuál es el único satélite natural que orbita el planeta Tierra?',
        options: ['A) La Luna', 'B) Titán', 'C) Europa', 'D) Ío'],
        answer: 'A'
    },
    {
        question: '¿Cuál es la capital de Canadá?',
        options: ['A) Toronto', 'B) Montreal', 'C) Ottawa', 'D) Vancouver'],
        answer: 'C'
    },
    {
        question: '¿Qué vitamina sintética produce el cuerpo humano principalmente expuesto a la luz solar?',
        options: ['A) Vitamina C', 'B) Vitamina D', 'C) Vitamina A', 'D) Vitamina B12'],
        answer: 'B'
    },
    {
        question: '¿Qué legendario héroe de la mitología griega era invulnerable salvo en su talón?',
        options: ['A) Aquiles', 'B) Hércules', 'C) Perseo', 'D) Teseo'],
        answer: 'A'
    },
    {
        question: '¿En qué antigua civilización oriental se inventó el papel?',
        options: ['A) Egipto', 'B) China', 'C) Mesopotamia', 'D) Grecia'],
        answer: 'B'
    },
    {
        question: '¿En qué franquicia de terror aparece el asesino en serie Michael Myers?',
        options: ['A) Viernes 13', 'B) Pesadilla en la calle Elm', 'C) Halloween', 'D) Masacre en Texas'],
        answer: 'C'
    },
    {
        question: '¿Cómo se llama la entidad de terror interpretada por Bill Skarsgård en la versión de 2017 de "It"?',
        options: ['A) Pennywise', 'B) Ronald', 'C) Lester', 'D) Joker'],
        answer: 'A'
    },
    {
        question: '¿En qué película de terror un grupo de astronautas encuentra una forma de vida extraterrestre en una nave espacial comercial?',
        options: ['A) Predator', 'B) Alien, el octavo pasajero', 'C) La Cosa', 'D) Cloverfield'],
        answer: 'B'
    },
    {
        question: '¿Qué arma utiliza Jason Voorhees preferentemente en sus masacres?',
        options: ['A) Un hacha', 'B) Una motosierra', 'C) Un machete', 'D) Un estilete'],
        answer: 'C'
    },
    {
        question: '¿Qué criatura sobrenatural combate el profesor Abraham Van Helsing?',
        options: ['A) Vampiro / Drácula', 'B) Hombre Lobo', 'C) La Momia', 'D) Frankestein'],
        answer: 'A'
    },
    {
        question: '¿En qué lago ficticio se encuentra el campamento devastado por Jason Voorhees?',
        options: ['A) Lake Placid', 'B) Crystal Lake', 'C) Silver Lake', 'D) Mirror Lake'],
        answer: 'B'
    },
    {
        question: '¿Qué afamado director dirigió la icónica película de terror "Psicosis" (1960)?',
        options: ['A) Stanley Kubrick', 'B) Steven Spielberg', 'C) Alfred Hitchcock', 'D) John Carpenter'],
        answer: 'C'
    },
    {
        question: '¿Cómo se llama la joven poseída en "El Exorcista"?',
        options: ['A) Regan MacNeil', 'B) Carol Anne', 'C) Samara Morgan', 'D) Nancy Thompson'],
        answer: 'A'
    },
    {
        question: '¿Qué saga de terror presenta el célebre dilema macabro "¿Quieres jugar un juego?"?',
        options: ['A) Destino Final', 'B) Saw (Juego del Miedo)', 'C) Hostal', 'D) La Purga'],
        answer: 'B'
    },
    {
        question: '¿Qué objeto es una enigmática caja rompecabezas que abre la puerta a los Cenobitas en "Hellraiser"?',
        options: ['A) La Caja de Lemarchand', 'B) La Caja de Pandora', 'C) El Cubo Necro', 'D) El Cofre del Dolor'],
        answer: 'A'
    },
    {
        question: '¿Cómo se llama el muñeco de ventrílocuo usado por Jigsaw en la saga "Saw"?',
        options: ['A) Chucky', 'B) Annabelle', 'C) Slappy', 'D) Billy'],
        answer: 'D'
    },
    {
        question: '¿Cómo se llama la entidad demoníaca que adopta la forma de una monja aterradora?',
        options: ['A) Pazuzu', 'B) Valak', 'C) Baphomet', 'D) Asmodeo'],
        answer: 'B'
    },
    {
        question: '¿Qué película de terror incluye la célebre frase "¡Aquí está Johnny!"?',
        options: ['A) El Resplandor', 'B) Psicosis', 'C) Misery', 'D) Poltergeist'],
        answer: 'A'
    },
    {
        question: '¿Qué película muestra la propagación de la ira en Gran Bretaña por un virus experimental?',
        options: ['A) Resident Evil', 'B) Guerra Mundial Z', 'C) 28 Días Después', 'D) Rec'],
        answer: 'C'
    },
    {
        question: '¿Cuál es la capital de Alemania?',
        options: ['A) Berlín', 'B) Múnich', 'C) Fráncfort', 'D) Hamburgo'],
        answer: 'A'
    },
    {
        question: '¿Qué instrumento de cuerda tocaba habitualmente el detective Sherlock Holmes?',
        options: ['A) Chelo', 'B) Piano', 'C) Violín', 'D) Flauta'],
        answer: 'C'
    },
    {
        question: '¿Qué océano limita al occidente con el continente europeo?',
        options: ['A) Pacífico', 'B) Atlántico', 'C) Índico', 'D) Ártico'],
        answer: 'B'
    },
    {
        question: '¿Qué milenaria arte marcial de combate sin armas se originó en Japón?',
        options: ['A) Karate', 'B) Taekwondo', 'C) Kung Fu', 'D) Muay Thai'],
        answer: 'A'
    },
    {
        question: '¿Qué elemento químico de la tabla periódica tiene como símbolo "Fe"?',
        options: ['A) Flúor', 'B) Fósforo', 'C) Hierro', 'D) Francio'],
        answer: 'C'
    },
    {
        question: '¿Qué navegante genovés llegó a América al mando de las carabelas en 1492?',
        options: ['A) Américo Vespucio', 'B) Cristóbal Colón', 'C) Fernando de Magallanes', 'D) Hernán Cortés'],
        answer: 'B'
    },
    {
        question: '¿Qué país sudamericano se proclamó campeón del Mundial de Fútbol de la FIFA en 2022?',
        options: ['A) Argentina', 'B) Brasil', 'C) Francia', 'D) Uruguay'],
        answer: 'A'
    },
    {
        question: '¿Cuál es el rascacielos más alto del planeta actualmente, situado en Dubái?',
        options: ['A) Shanghai Tower', 'B) Burj Khalifa', 'C) Abraj Al Bait', 'D) One World Trade Center'],
        answer: 'B'
    },
    {
        question: '¿Cuántos minutos exactos equivalen a una hora?',
        options: ['A) 100', 'B) 50', 'C) 90', 'D) 60'],
        answer: 'D'
    },
    {
        question: '¿Cuál es el idioma oficial hablado en Brasil?',
        options: ['A) Español', 'B) Inglés', 'C) Portugués', 'D) Francés'],
        answer: 'C'
    }
];

function normalizeText(str) {
    if (!str) return '';
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

async function processAnswer(m, conn, option) {
    const chatGame = global.triviaGames[m.chat];
    const currentQ = chatGame.questions[chatGame.currentQuestionIndex];
    const isCorrect = option === currentQ.answer;

    if (isCorrect) {
        chatGame.score++;
    }

    chatGame.currentQuestionIndex++;

    if (chatGame.currentQuestionIndex < chatGame.questions.length) {
        const nextQ = chatGame.questions[chatGame.currentQuestionIndex];
        const optionsText = nextQ.options.map(opt => `  ➤ ${opt}`).join('\n');
        const numPregunta = chatGame.currentQuestionIndex + 1;

        const feedback = isCorrect 
            ? `♛ *¡RESPUESTA CORRECTA!* (${option})` 
            : `✘ *INCORRECTA*. La opción correcta era: *${currentQ.answer}*`;

        const texto = `${feedback}\n\n` +
                      `𖤍 *RETO DE TRIVIA (${numPregunta}/3)* 𖤍\n\n` +
                      `➤ *Pregunta* : ${nextQ.question}\n\n` +
                      `✍ *Opciones* :\n${optionsText}\n\n` +
                      `✰ Responde enviando *A*, *B*, *C* o *D*.`;

        const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });
        chatGame.msgId = enviado.key.id;
    } else {
        const finalFeedback = isCorrect 
            ? `♛ *¡RESPUESTA CORRECTA!* (${option})` 
            : `✘ *INCORRECTA*. La opción correcta era: *${currentQ.answer}*`;

        const textoFinal = `${finalFeedback}\n\n` +
                           `♛ *TRIVIA FINALIZADA* ♛\n\n` +
                           `➤ *Puntuación Final* : ${chatGame.score} / 3 aciertos.\n` +
                           `✍ *Resultado* : ${chatGame.score === 3 ? '¡Excelente! Acertaste todas las preguntas.' : chatGame.score > 0 ? '¡Buen intento!' : 'Más suerte la próxima vez.'}`;

        await conn.sendMessage(m.chat, { text: textoFinal }, { quoted: m });
        delete global.triviaGames[m.chat];
    }
}

export const triviaCommand = {
    category: 'GAME',
    commands: {
        trivia: {
            name: 'trivia',
            alias: ['t', 'preguntas'],
            desc: 'Juego de trivia de 3 preguntas consecutivas.',
            async before(m, { conn }) {
                global.triviaGames = global.triviaGames || {};
                const chatGame = global.triviaGames[m.chat];
                if (!chatGame || chatGame.gameOver || m.isBaileys || m.fromMe) return false;

                const quotedId = m.quoted?.id || m.msg?.contextInfo?.stanzaId;
                if (!quotedId || quotedId !== chatGame.msgId) return false;

                const textTrim = (m.text || '').trim().toUpperCase();
                if (!['A', 'B', 'C', 'D'].includes(textTrim)) return false;

                await processAnswer(m, conn, textTrim);
                return true;
            },
            run: async (m, { conn, args }) => {
                global.triviaGames = global.triviaGames || {};
                global.usedTriviaIndices = global.usedTriviaIndices || [];

                const option = args[0] ? args[0].toUpperCase() : null;

                if (option && ['A', 'B', 'C', 'D'].includes(option)) {
                    const game = global.triviaGames[m.chat];
                    if (!game) {
                        return conn.sendMessage(m.chat, {
                            text: `⍰ *ATENCIÓN* : No tienes ninguna trivia activa. Usa .trivia para iniciar una.`
                        }, { quoted: m });
                    }
                    await processAnswer(m, conn, option);
                    return true;
                }

                if (global.triviaGames[m.chat]) {
                    return conn.sendMessage(m.chat, {
                        text: `⍰ *ATENCIÓN* : Ya hay una trivia activa en este chat. Responde enviando A, B, C o D.`
                    }, { quoted: m });
                }

                const selectedQuestions = [];
                while (selectedQuestions.length < 3) {
                    if (global.usedTriviaIndices.length >= questions.length) {
                        global.usedTriviaIndices = [];
                    }
                    let randomIndex;
                    do {
                        randomIndex = Math.floor(Math.random() * questions.length);
                    } while (global.usedTriviaIndices.includes(randomIndex) || selectedQuestions.some(q => q.index === randomIndex));

                    global.usedTriviaIndices.push(randomIndex);
                    selectedQuestions.push({ ...questions[randomIndex], index: randomIndex });
                }

                const firstQ = selectedQuestions[0];
                const optionsText = firstQ.options.map(opt => `  ➤ ${opt}`).join('\n');

                const texto = `𖤍 *RETO DE TRIVIA (1/3)* 𖤍\n\n` +
                              `➤ *Pregunta* : ${firstQ.question}\n\n` +
                              `✍ *Opciones* :\n${optionsText}\n\n` +
                              `✰ Responde enviando *A*, *B*, *C* o *D*.`;

                const enviado = await conn.sendMessage(m.chat, { text: texto }, { quoted: m });

                global.triviaGames[m.chat] = {
                    questions: selectedQuestions,
                    currentQuestionIndex: 0,
                    score: 0,
                    msgId: enviado.key.id,
                    gameOver: false
                };

                return true;
            }
        }
    }
};
