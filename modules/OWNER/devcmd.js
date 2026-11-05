import {
    unlockCommand,
    lockCommand,
    resetCommand,
    getCommandStatus,
    getAllCommandsStatus
} from '../../core/error-tracker.js';

function formatEntry(name, entry) {
    const now = Date.now();
    const lines = [];
    lines.push(`╭━━〔 *${name}* 〕━━`);
    lines.push(`┃ ❖ *Estado:* ${entry.status}`);
    lines.push(`┃ ❖ *Errores totales:* ${entry.totalErrors}`);
    lines.push(`┃ ❖ *Errores actuales (5 min):* ${entry.errors?.length || 0}`);
    if (entry.status === 'temporary' && entry.unlockAt) {
        const mins = Math.max(1, Math.ceil((entry.unlockAt - now) / 60000));
        lines.push(`┃ ❖ *Reactivación en:* ${mins} min`);
    }
    if (entry.status === 'permanent') {
        lines.push(`┃ ❖ *Bloqueado:* permanentemente (requiere .unlock)`);
    }
    if (entry.manual) lines.push(`┃ ❖ *Manual:* sí`);
    if (entry.lastBlockReason) lines.push(`┃ ❖ *Razón:* ${entry.lastBlockReason}`);
    if (entry.lastError) {
        lines.push(`┃ ❖ *Último error:* ${String(entry.lastError.message || '').slice(0, 120)}`);
        if (entry.lastError.sender) lines.push(`┃ ❖ *Usuario:* ${entry.lastError.sender}`);
        if (entry.lastError.chat) lines.push(`┃ ❖ *Chat:* ${entry.lastError.chat}`);
        if (entry.lastError.botJid) lines.push(`┃ ❖ *Bot:* ${entry.lastError.botJid}`);
        if (entry.lastError.time) lines.push(`┃ ❖ *Hora:* ${new Date(entry.lastError.time).toLocaleString()}`);
    }
    lines.push(`╰━━━━━━━━━━━━━━━━━━━━`);
    return lines.join('\n');
}

export const devcmdModule = {
    category: 'owner',
    commands: {
        unlock: {
            name: 'unlock',
            alias: ['desbloquear', 'unlockcmd'],
            rowner: true,
            description: 'Desbloquea un comando que fue bloqueado por errores.',
            run: async (m, { args, conn, usedPrefix }) => {
                const target = (args[0] || '').toLowerCase().replace(/^[./#!]+/, '');
                if (!target) return m.reply(`❌ Uso: ${usedPrefix}unlock <comando>`);
                const st = getCommandStatus(target);
                if (!st) return m.reply(`❌ El comando *${target}* no tiene registro de errores.`);
                const ok = unlockCommand(target);
                if (!ok) return m.reply(`❌ No se pudo desbloquear *${target}*.`);
                return m.reply(`✅ Comando *${target}* desbloqueado. Ya puede volver a ejecutarse.`);
            }
        },
        lock: {
            name: 'lock',
            alias: ['bloquear', 'lockcmd'],
            rowner: true,
            description: 'Bloquea manualmente un comando.',
            run: async (m, { args, conn, usedPrefix }) => {
                const target = (args[0] || '').toLowerCase().replace(/^[./#!]+/, '');
                const reason = args.slice(1).join(' ') || 'Bloqueo manual por desarrollador';
                if (!target) return m.reply(`❌ Uso: ${usedPrefix}lock <comando> [razón]`);
                const ok = lockCommand(target, reason);
                if (!ok) return m.reply(`❌ No se pudo bloquear *${target}*.`);
                return m.reply(`🔒 Comando *${target}* bloqueado.\n\n*Razón:* ${reason}`);
            }
        },
        resetcmd: {
            name: 'resetcmd',
            alias: ['resetcommand', 'cmdreset'],
            rowner: true,
            description: 'Borra todo el historial de errores de un comando.',
            run: async (m, { args, usedPrefix }) => {
                const target = (args[0] || '').toLowerCase().replace(/^[./#!]+/, '');
                if (!target) return m.reply(`❌ Uso: ${usedPrefix}resetcmd <comando>`);
                const ok = resetCommand(target);
                if (!ok) return m.reply(`❌ No hay datos para *${target}*.`);
                return m.reply(`🧹 Historial de *${target}* eliminado.`);
            }
        },
        cmdstatus: {
            name: 'cmdstatus',
            alias: ['statuscmd', 'estadocmd'],
            rowner: true,
            description: 'Muestra el estado de un comando.',
            run: async (m, { args, usedPrefix }) => {
                const target = (args[0] || '').toLowerCase().replace(/^[./#!]+/, '');
                if (!target) return m.reply(`❌ Uso: ${usedPrefix}cmdstatus <comando>`);
                const st = getCommandStatus(target);
                if (!st) return m.reply(`❌ El comando *${target}* no tiene registro de errores.`);
                return m.reply(formatEntry(target, st));
            }
        },
        cmderrors: {
            name: 'cmderrors',
            alias: ['errorescmd'],
            rowner: true,
            description: 'Muestra el último error registrado de un comando.',
            run: async (m, { args, usedPrefix }) => {
                const target = (args[0] || '').toLowerCase().replace(/^[./#!]+/, '');
                if (!target) return m.reply(`❌ Uso: ${usedPrefix}cmderrors <comando>`);
                const st = getCommandStatus(target);
                if (!st || !st.lastError) return m.reply(`❌ No hay errores registrados para *${target}*.`);
                const e = st.lastError;
                const txt = `╭━━〔 *ERROR: ${target}* 〕━━\n` +
                    `┃ ❖ *Mensaje:* ${e.message || 'desconocido'}\n` +
                    `┃ ❖ *Usuario:* ${e.sender || 'n/d'}\n` +
                    `┃ ❖ *Chat:* ${e.chat || 'n/d'}\n` +
                    `┃ ❖ *Bot:* ${e.botJid || 'n/d'}\n` +
                    `┃ ❖ *Hora:* ${e.time ? new Date(e.time).toLocaleString() : 'n/d'}\n` +
                    `╰━━━━━━━━━━━━━━━━━━━━`;
                await conn.sendMessage(m.chat, { text: txt }, { quoted: m }).catch(() => null);
                if (e.stack) {
                    await conn.sendMessage(m.chat, { text: `\`\`\`${e.stack}\`\`\`` }, { quoted: m }).catch(() => null);
                }
                return;
            }
        },
        blockedcmds: {
            name: 'blockedcmds',
            alias: ['bloqueados', 'listblocked'],
            rowner: true,
            description: 'Lista todos los comandos bloqueados.',
            run: async (m, { conn }) => {
                const all = getAllCommandsStatus();
                const blocked = Object.entries(all).filter(([, v]) => v.status === 'temporary' || v.status === 'permanent');
                if (!blocked.length) return m.reply('✅ No hay comandos bloqueados actualmente.');
                let txt = `🚫 *COMANDOS BLOQUEADOS (${blocked.length})*\n\n`;
                for (const [name, entry] of blocked) {
                    const tipo = entry.status === 'permanent' ? 'PERMANENTE' : 'TEMPORAL';
                    txt += `• *${name}* — ${tipo} — ${entry.totalErrors} errores totales\n`;
                }
                txt += `\nUsa *.unlock <comando>* para desbloquear uno.`;
                return m.reply(txt);
            }
        }
    }
};