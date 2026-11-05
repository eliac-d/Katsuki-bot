import mongoose from 'mongoose';
import { createCanvas } from '@napi-rs/canvas';

const MONGO_URI = 'mongodb+srv://voker:voker@cluster0.dsle1da.mongodb.net/bot?retryWrites=true&w=majority';

if (mongoose.connection.readyState === 0) {
    mongoose.connect(MONGO_URI).catch(err => console.error(err));
}

const appointmentSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    itemNumber: { type: Number, required: true },
    title: { type: String, required: true },
    date: { type: Date, required: true, default: Date.now },
    status: { type: String, enum: ['pendiente', 'completada'], default: 'pendiente' },
    createdAt: { type: Date, default: Date.now }
});

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);

function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const width = ctx.measureText(currentLine + (currentLine ? ' ' : '') + word).width;
        if (width < maxWidth) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            if (currentLine) lines.push(currentLine);
            if (ctx.measureText(word).width > maxWidth) {
                let subWord = '';
                for (let char of word) {
                    if (ctx.measureText(subWord + char).width < maxWidth) {
                        subWord += char;
                    } else {
                        lines.push(subWord);
                        subWord = char;
                    }
                }
                currentLine = subWord;
            } else {
                currentLine = word;
            }
        }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
}

export const agendaModule = {
    category: 'tools',
    commands: {
        agendar: {
            name: 'agendar',
            alias: ['addagenda', 'cita', 'guardar'],
            run: async (m, { text, usedPrefix, command }) => {
                try {
                    let title = text ? text.trim() : '';
                    if (!title) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} Texto o nota a recordar`);
                    }

                    await m.react('📝');

                    const count = await Appointment.countDocuments({ userId: m.sender, status: 'pendiente' });
                    const nextNumber = Number(count) + 1;

                    const newAppointment = new Appointment({
                        userId: m.sender,
                        itemNumber: nextNumber,
                        title: title,
                        date: new Date()
                    });

                    await newAppointment.save();

                    await m.react('✅');
                    return m.reply(`> *Agendado con éxito*\n> *Número:* #${newAppointment.itemNumber}\n> *Nota:*${title}`);
                } catch (error) {
                    console.error(error);
                    await m.react('❌');
                    return m.reply(`> Error al agendar: ${error.message}`);
                }
            }
        },
        agenda: {
            name: 'agenda',
            alias: ['miscitas', 'veragenda'],
            run: async (m, { text, usedPrefix }) => {
                try {
                    const param = text ? text.trim() : '';

                    if (param && !isNaN(parseInt(param))) {
                        return agendaModule.commands.vercita.run(m, { text: param, usedPrefix });
                    }

                    await m.react('⏳');

                    const appointments = await Appointment.find({
                        userId: m.sender,
                        status: 'pendiente'
                    }).sort({ itemNumber: 1 });

                    if (appointments.length === 0) {
                        await m.react('📌');
                        return m.reply(`> No tienes tareas o notas pendientes.`);
                    }

                    let listMsg = `> *LISTA DE AGENDA PENDIENTE*\n\n`;
                    appointments.forEach((item) => {
                        const shortTitle = item.title.length > 40 ? item.title.substring(0, 40) + '...' : item.title;
                        listMsg += `> *#${item.itemNumber}* -${shortTitle}\n`;
                    });

                    listMsg += `\n> *Instrucciones:*`;
                    listMsg += `\n> • Usa \`${usedPrefix}vercita <número>\` para ver el detalle en imagen.`;
                    listMsg += `\n> • Usa \`${usedPrefix}editar <número> <nuevo texto>\` para modificar.`;
                    listMsg += `\n> • Usa \`${usedPrefix}completado <número>\` para finalizar y eliminar.`;

                    await m.react('✅');
                    return m.reply(listMsg);
                } catch (error) {
                    console.error(error);
                    await m.react('❌');
                    return m.reply(`> Error al consultar la agenda: ${error.message}`);
                }
            }
        },
        vercita: {
            name: 'vercita',
            alias: ['vernota', 'detalle'],
            run: async (m, { conn, text, usedPrefix }) => {
                try {
                    const num = parseInt(text.trim());
                    if (isNaN(num)) {
                        return m.reply(`> *Uso:* ${usedPrefix}vercita <número>`);
                    }

                    await m.react('⏳');

                    const item = await Appointment.findOne({
                        userId: m.sender,
                        itemNumber: num,
                        status: 'pendiente'
                    });

                    if (!item) {
                        await m.react('❌');
                        return m.reply(`> No se encontró la tarea o nota #${num}.`);
                    }

                    const dummyCanvas = createCanvas(800, 200);
                    const dummyCtx = dummyCanvas.getContext('2d');
                    dummyCtx.font = '20px sans-serif';

                    const lines = wrapText(dummyCtx, item.title, 700);
                    const lineHeight = 28;
                    const contentHeight = lines.length * lineHeight;
                    const canvasHeight = Math.max(220, contentHeight + 140);

                    const canvas = createCanvas(800, canvasHeight);
                    const ctx = canvas.getContext('2d');

                    ctx.fillStyle = '#f8f9fa';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    ctx.fillStyle = '#ffffff';
                    ctx.strokeStyle = '#e9ecef';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(20, 20, 760, canvasHeight - 40, 16);
                    ctx.fill();
                    ctx.stroke();

                    ctx.fillStyle = '#0d6efd';
                    ctx.font = 'bold 28px sans-serif';
                    ctx.fillText(`TAREA #${item.itemNumber}`, 50, 65);

                    ctx.fillStyle = '#6c757d';
                    ctx.font = '14px sans-serif';
                    ctx.textAlign = 'right';
                    ctx.fillText(new Date(item.date).toLocaleString(), 750, 65);
                    ctx.textAlign = 'left';

                    ctx.strokeStyle = '#dee2e6';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(50, 85);
                    ctx.lineTo(750, 85);
                    ctx.stroke();

                    ctx.fillStyle = '#212529';
                    ctx.font = '20px sans-serif';
                    let startY = 125;

                    lines.forEach((line) => {
                        ctx.fillText(line, 50, startY);
                        startY += lineHeight;
                    });

                    const imageBuffer = await canvas.toBuffer('image/png');

                    await conn.sendMessage(m.chat, {
                        image: imageBuffer,
                        caption: `• *Tarea #${item.itemNumber}*\n• Marca como realizada con: \`${usedPrefix}completado ${item.itemNumber}\``
                    }, { quoted: m });

                    await m.react('✅');
                } catch (error) {
                    console.error(error);
                    await m.react('❌');
                    return m.reply(`> Error al generar detalle: ${error.message}`);
                }
            }
        },
        editar: {
            name: 'editar',
            alias: ['editarcita', 'modificar'],
            run: async (m, { text, usedPrefix, command }) => {
                try {
                    if (!text || !text.includes(' ')) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} <número> <nuevo texto>`);
                    }

                    const firstSpaceIndex = text.trim().indexOf(' ');
                    const numStr = text.trim().substring(0, firstSpaceIndex);
                    const newTitle = text.trim().substring(firstSpaceIndex + 1).trim();

                    const num = parseInt(numStr);

                    if (isNaN(num) || !newTitle) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} <número> <nuevo texto>`);
                    }

                    await m.react('⏳');

                    const updated = await Appointment.findOneAndUpdate(
                        { itemNumber: num, userId: m.sender, status: 'pendiente' },
                        { title: newTitle, date: new Date() },
                        { new: true }
                    );

                    if (!updated) {
                        await m.react('❌');
                        return m.reply(`> No se encontró la tarea #${num} para editar.`);
                    }

                    await m.react('✅');
                    return m.reply(`> *Tarea #${num} actualizada con éxito*\n> *Nuevo contenido:* ${newTitle}`);
                } catch (error) {
                    console.error(error);
                    await m.react('❌');
                    return m.reply(`> Error al editar: ${error.message}`);
                }
            }
        },
        completado: {
            name: 'completado',
            alias: ['hecho', 'tareahecha', 'completar'],
            run: async (m, { text, usedPrefix, command }) => {
                try {
                    const num = parseInt(text.trim());
                    if (isNaN(num)) {
                        return m.reply(`> *Uso:* ${usedPrefix + command} <número_de_la_cita>`);
                    }

                    await m.react('⏳');

                    const updated = await Appointment.findOneAndUpdate(
                        { itemNumber: num, userId: m.sender, status: 'pendiente' },
                        { status: 'completada' },
                        { new: true }
                    );

                    if (!updated) {
                        await m.react('❌');
                        return m.reply(`> No se encontró la tarea #${num}.`);
                    }

                    const remaining = await Appointment.find({ userId: m.sender, status: 'pendiente' }).sort({ createdAt: 1 });

                    await Promise.all(remaining.map((doc, index) => {
                        doc.itemNumber = index + 1;
                        return doc.save();
                    }));

                    await m.react('✅');
                    return m.reply(`> *Tarea #${num} completada y eliminada de pendientes.*`);
                } catch (error) {
                    console.error(error);
                    await m.react('❌');
                    return m.reply(`> Error al completar tarea: ${error.message}`);
                }
            }
        }
    }
};
