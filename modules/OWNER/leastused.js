export const leastUsedModule = {
    category: 'owner',
    commands: {
        leastused: {
            name: 'leastused',
            alias: ['menosusados', 'topunused'],
            desc: 'Muestra los comandos menos utilizados para optimización del sistema.',
            run: async (m, { conn, args, isOwner }) => {
                const senderNumber = m.sender.replace(/[^0-9]/g, '');
                const ownerList = global.owner || [];
                const checkOwner = isOwner || m.fromMe || ownerList.some(owner => String(owner).includes(senderNumber));

                if (!checkOwner) {
                    return m.reply('Este comando es exclusivo para los propietarios del bot.');
                }

                if (!global.db?.data?.stats) {
                    return m.reply('No se encontraron registros de uso en la base de datos. Asegúrate de registrar las estadísticas en el handler.');
                }

                const stats = global.db.data.stats;
                const commandEntries = Object.entries(stats);

                if (commandEntries.length === 0) {
                    return m.reply('Aún no hay métricas registradas en el sistema.');
                }

                let limit = 10;
                if (args[0] && !isNaN(args[0]) && parseInt(args[0]) > 0) {
                    limit = Math.min(50, parseInt(args[0]));
                }

                const sortedCommands = commandEntries.sort((a, b) => {
                    const countA = typeof a[1] === 'object' ? (a[1].total || 0) : Number(a[1]) || 0;
                    const countB = typeof b[1] === 'object' ? (b[1].total || 0) : Number(b[1]) || 0;
                    return countA - countB;
                });

                const leastUsed = sortedCommands.slice(0, limit);

                let reportText = `*MÉTRICAS DE OPTIMIZACIÓN*\n`;
                reportText += `_Comandos menos utilizados_\n\n`;

                leastUsed.forEach(([cmd, data], index) => {
                    const count = typeof data === 'object' ? (data.total || 0) : Number(data) || 0;
                    reportText += `${index + 1}. *${cmd}* : ${count} uso(s)\n`;
                });

                reportText += `\nInformación destinada a la limpieza de funciones sin uso.`;

                return m.reply(reportText);
            }
        }
    }
};
