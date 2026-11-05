import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export const checkSyntaxModule = {
    category: 'owner',
    commands: {
        errores: {
            name: 'errores',
            alias: ['checkall', 'debug'],
            run: async (m, { conn }) => {
                const rootDir = process.cwd();
                let reports = [];
                let filesChecked = 0;

                const validateFile = async (fullPath) => {
                    const relPath = path.relative(rootDir, fullPath);
                    try {
                        execSync(`node --check "${fullPath}"`, {
                            stdio: 'pipe',
                            timeout: 5000,
                            windowsHide: true
                        });
                    } catch (err) {
                        const errorMessage = err.stderr ? err.stderr.toString().split('\n')[0] : err.message;
                        reports.push(`📄 *ARCHIVO:* \`${relPath}\`
⚠️ *ERROR:* \`${errorMessage}\`
📍 *TIPO:* Fallo de Importación/Sintaxis`);
                    }
                };

                const walk = async (dir) => {
                    let files;
                    try {
                        files = await fs.promises.readdir(dir);
                    } catch (_) {
                        return;
                    }

                    for (const file of files) {
                        const fullPath = path.join(dir, file);
                        let stat;
                        try {
                            stat = await fs.promises.stat(fullPath);
                        } catch (_) {
                            continue;
                        }

                        if (stat.isDirectory()) {
                            if (['node_modules', '.git', 'sessions', 'tmp', '.npm'].includes(file)) continue;
                            await walk(fullPath);
                        } else if (file.endsWith('.js') || file.endsWith('.mjs')) {
                            filesChecked++;
                            await validateFile(fullPath);
                        }
                    }
                };

                try {
                    await m.react('🕒');
                    await walk(rootDir);

                    if (reports.length === 0) {
                        await m.react('✅');
                        return await conn.sendMessage(m.chat, { 
                            text: `✅ *PROYECTO LIMPIO*\n\nSe revisaron *${filesChecked}* archivos en todo el sistema y no se detectaron fallos.` 
                        }, { quoted: m });
                    }

                    let header = `🚨 *REPORTE DE ERRORES (${reports.length})*\n\n`;
                    let chunks = [];
                    let currentChunk = header;

                    for (let report of reports) {
                        if ((currentChunk + report).length > 3500) {
                            chunks.push(currentChunk);
                            currentChunk = '';
                        }
                        currentChunk += report + '\n' + '─'.repeat(15) + '\n';
                    }
                    chunks.push(currentChunk + `\n*Total revisado:* ${filesChecked} archivos.`);

                    for (let text of chunks) {
                        await conn.sendMessage(m.chat, { text }, { quoted: m });
                    }
                    await m.react('⚠️');

                } catch (e) {
                    await m.react('✖️');
                    await m.reply('❌ Error en el escáner: ' + e.message);
                }
            }
        }
    }
};
