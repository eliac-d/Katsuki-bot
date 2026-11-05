
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEV_GROUP_JID = [ '120363412420888304@g.us', '50432955554@s.whatsapp.net' ];

const runCmd = (cmd) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
        if (err) return reject(stderr || err.message);
        resolve(stdout);
    });
});

export const updateCommand = {
    commands: {
        update: {
            name: 'update',
            alias: ['actualizar', 'up', 'sync'],
            category: 'owner',
            rowner: true,
            run: async (m, { conn, args }) => {
               /* if (m.chat !== DEV_GROUP_JID) {
                    return conn.sendMessage(m.chat, { text: '• Acceso restringido al grupo de desarrollo oficial.' }, { quoted: m });
                }*/

                try {
                    const HEAD_BEFORE = (await runCmd('git rev-parse HEAD')).trim();
                    const output = await runCmd(`git pull ${args[0] || ''}`);

                    if (/Already up[ -]to[ -]date/i.test(output)) {
                        return conn.sendMessage(m.chat, { text: '• El repositorio ya se encuentra actualizado.' }, { quoted: m });
                    }

                    const HEAD_AFTER = (await runCmd('git rev-parse HEAD')).trim();

                    let author = 'Desconocido';
                    try {
                        const logAuthor = await runCmd(`git log -1 --format="%an" ${HEAD_AFTER}`);
                        if (logAuthor.trim()) author = logAuthor.trim();
                    } catch {}

                    let filesList = '';
                    let totalAdditions = 0;
                    let totalDeletions = 0;

                    try {
                        const numstatOutput = await runCmd(`git diff --numstat ${HEAD_BEFORE}..${HEAD_AFTER}`);
                        const lines = numstatOutput.trim().split('\n').filter(Boolean);

                        filesList = lines.map(line => {
                            const [added, deleted, filePath] = line.split(/\s+/);
                            const addNum = parseInt(added, 10) || 0;
                            const delNum = parseInt(deleted, 10) || 0;
                            totalAdditions += addNum;
                            totalDeletions += delNum;

                            return `• ${filePath}\n  +${addNum} | -${delNum}`;
                        }).join('\n');
                    } catch {}

                    let formattedMessage = `*AUTOR:* ${author}\n\n`;
                    formattedMessage += `*ARCHIVOS MODIFICADOS:*\n${filesList || '• Sin detalles de archivos'}\n\n`;
                    formattedMessage += `*CAMBIOS TOTALES:*\n+${totalAdditions}\n-${totalDeletions}\n\n`;
                    formattedMessage += `Re-indexando módulos...`;

                    await conn.sendMessage(m.chat, { text: formattedMessage }, { quoted: m });

                    if (typeof global.reloadModules === 'function') {
                        await global.reloadModules(true);
                    }
                    if (typeof global.reload === 'function') {
                        await global.reload(true);
                    }

                    return conn.sendMessage(m.chat, { text: '• Despliegue completado con éxito.' }, { quoted: m });

                } catch (error) {
                    let status = '';
                    try { status = await runCmd('git status --porcelain'); } catch { status = 'Error al verificar estado'; }

                    const conflictMsg = status.trim() 
                        ? status.trim() 
                        : error.toString();

                    await conn.sendMessage(m.chat, { text: `*ERROR DE ACTUALIZACIÓN*\n\n${conflictMsg}` }, { quoted: m });
                }
            }
        }
    }
};
