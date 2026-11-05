import os from 'os';

export const testModule = {
    category: 'TOOLS',
    commands: {
        test: {
            name: 'test',
            alias: ['ping', 'prueba'],
            desc: 'Verifica la velocidad de respuesta, latencia y métricas del servidor.',
            run: async (m, { conn }) => {
                const start = Date.now();

                const response = await m.reply('𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n• *Estado* : Recopilando métricas del sistema...');

                const end = Date.now();
                const latency = end - start;

                const uptimeSeconds = process.uptime();
                const hours = Math.floor(uptimeSeconds / 3600);
                const minutes = Math.floor((uptimeSeconds % 3600) / 60);
                const seconds = Math.floor(uptimeSeconds % 60);
                const uptimeFormatted = `${hours}h ${minutes}m ${seconds}s`;

                const totalMemory = os.totalmem();
                const freeMemory = os.freemem();
                const usedMemory = totalMemory - freeMemory;
                
                const formatBytes = (bytes) => {
                    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                    if (bytes === 0) return '0 Byte';
                    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
                    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
                };

                const cpuLoad = os.loadavg()[0].toFixed(2);

                const text = 
                    `𖦹 𝘒𝘢𝘵𝘴𝘶𝘬𝘪𝘉𝘰𝘵 𝘔𝘋 𖦹\n\n` +
                    `*» MÉTRICAS DEL SERVIDOR «*\n\n` +
                    `• *Estado* : Activo y Estable ✅\n` +
                    `• *Latencia* : ${latency} ms\n` +
                    `• *Tiempo Online* : ${uptimeFormatted}\n` +
                    `• *Carga CPU (1m)* : ${cpuLoad}%\n` +
                    `• *Memoria RAM* : ${formatBytes(usedMemory)} / ${formatBytes(totalMemory)}\n` +
                    `• *SubBot ID* : @${(conn.user?.id || '').split(':')[0]}`;

                if (response && response.key) {
                    return conn.sendMessage(m.chat, { 
                        text, 
                        edit: response.key,
                        mentions: [conn.user?.id]
                    });
                } else {
                    return m.reply(text, null, { mentions: [conn.user?.id] });
                }
            }
        }
    }
};
