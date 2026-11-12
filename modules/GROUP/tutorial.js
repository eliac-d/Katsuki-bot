import { createCanvas } from '@napi-rs/canvas';

const drawRoundedRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
};

const generateTutorialImage = async () => {
  const width = 900;
  const height = 550;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Fondo principal con degradado oscuro
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#07080b');
  bgGradient.addColorStop(1, '#0e1118');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Tarjeta contenedora principal
  const cardX = 30;
  const cardY = 30;
  const cardW = width - 60;
  const cardH = height - 60;

  drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 20);
  ctx.fillStyle = '#0f121a';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#1e2433';
  ctx.stroke();

  // Título de la tarjeta
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 28px sans-serif';
  ctx.fillText('📖 Guía Rápida & Tutorial', cardX + 40, cardY + 55);

  ctx.fillStyle = '#3b82f6';
  ctx.font = '600 16px sans-serif';
  ctx.fillText('Aprende a usar el bot y configura tu perfil', cardX + 40, cardY + 80);

  // Sección 1: Ver Menú
  ctx.fillStyle = '#171b26';
  drawRoundedRect(ctx, cardX + 40, cardY + 110, 380, 160, 12);
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('1. Ver Comandos', cardX + 65, cardY + 145);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText('Usa el comando para ver el listado:', cardX + 65, cardY + 175);
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 16px monospace';
  ctx.fillText('.menu', cardX + 65, cardY + 210);

  // Sección 2: Configurar Perfil
  ctx.fillStyle = '#171b26';
  drawRoundedRect(ctx, cardX + 440, cardY + 110, 390, 360, 12);
  ctx.fill();
  ctx.fillStyle = '#34d399';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('2. Personaliza tu Perfil', cardX + 465, cardY + 145);
  
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Configura tus datos personales con:', cardX + 465, cardY + 175);

  const commandsList = [
    { cmd: '.setage (tu edad)', desc: 'Ej: .setage 18' },
    { cmd: '.setorientacion', desc: 'Configura tu orientación' },
    { cmd: '.setgenero', desc: 'Configura tu género' },
    { cmd: '.setdesc', desc: 'Escribe tu descripción' }
  ];

  let startY = cardY + 205;
  commandsList.forEach((item) => {
    ctx.fillStyle = '#60a5fa';
    ctx.font = '700 14px monospace';
    ctx.fillText(item.cmd, cardX + 465, startY);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(item.desc, cardX + 465, startY + 18);
    startY += 40;
  });

  // Pie de tarjeta / Agradecimiento
  ctx.fillStyle = '#171b26';
  drawRoundedRect(ctx, cardX + 40, cardY + 290, 380, 180, 12);
  ctx.fill();
  ctx.fillStyle = '#f43f5e';
  ctx.font = '700 18px sans-serif';
  ctx.fillText('💡 Consejos Útiles', cardX + 65, cardY + 325);
  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('• Responde a mensajes o menciona', cardX + 65, cardY + 360);
  ctx.fillText('  usuarios para comandos interactivos.', cardX + 65, cardY + 380);
  ctx.fillText('• ¡Gracias por utilizar nuestro bot!', cardX + 65, cardY + 430);

  return canvas.encode('png');
};

export const tutorialCommand = {
  category: 'group',
  commands: {
    tutorial: {
      name: 'tutorial',
      alias: ['guide', 'ayuda', 'howtouse'],
      run: async function (m, { conn }) {
        const imageBuffer = await generateTutorialImage();
        const botName = conn?.user?.name || 'Bot';

        const caption = `
*» GUÍA Y TUTORIAL DE USO*[span_0](start_span)[span_0](end_span)

1. **Ver menú principal:** Usa el comando \`.menu\` para desplegar todas las categorías y herramientas disponibles[span_1](start_span)[span_1](end_span).
2. **Personaliza tu perfil:**
   • \`.setage (tu edad)\`[span_2](start_span)[span_2](end_span)
   • \`.setorientacion\`[span_3](start_span)[span_3](end_span)
   • \`.setgenero\`[span_4](start_span)[span_4](end_span)
   • \`.setdesc (tu descripción)\`[span_5](start_span)[span_5](end_span)

_¡Gracias por utilizar nuestro bot!_[span_6](start_span)[span_6](end_span)
`.trim();

        await conn.sendMessage(m.chat, {
          product: {
            productImage: imageBuffer,
            title: `${botName} - Tutorial`,
            retailerId: "1467",
            productId: "37199733896340480",
            productImageCount: 1,
          },
          businessOwnerJid: "50432955554@s.whatsapp.net",
          footer: caption
        }, { messageType: 'product', quoted: m });
      }
    }
  }
};
