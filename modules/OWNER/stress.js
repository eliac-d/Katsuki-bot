import { performance } from 'perf_hooks';

export const stressTestCommand = {
    category: 'owner',
    commands: {
        stresstest: {
            name: 'stresstest',
            alias: ['stress', 'benchmark', 'loadtest'],
            libre: false,
            owner: true,
            run: async (m, ctx) => {
                const { conn } = ctx;
                const textArgs = m.text ? m.text.trim().split(/\s+/).slice(1) : [];
                
                let count = parseInt(textArgs[0]) || 5;
                if (count > 10) count = 10;
                if (count < 1) count = 1;

                await m.reply(`🧪 *Prueba de Rendimiento (Stress Test)*\nEjecutando prueba con ${count} mensajes de control...`);

                const startTime = performance.now();
                let sentCount = 0;

                for (let i = 1; i <= count; i++) {
                    try {
                        await conn.sendMessage(m.chat, { text: `⚡ [Test ${i}/${count}] Verificando rendimiento del socket...` });
                        sentCount++;
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    } catch (error) {
                        console.error(`Error en iteración ${i}:`, error);
                    }
                }

                const totalTime = ((performance.now() - startTime) / 1000).toFixed(2);
                const avgLatency = (totalTime / sentCount).toFixed(2);

                return m.reply(
                    `📊 *Resultados del Stress Test*\n\n` +
                    `• Mensajes entregados: *${sentCount}/${count}*\n` +
                    `• Tiempo total: *${totalTime} segundos*\n` +
                    `• Latencia promedio: *${avgLatency}s por mensaje*`
                );
            }
        }
    }
};
