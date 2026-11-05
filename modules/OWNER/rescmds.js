import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database', 'local_db.json');

const readDb = () => {
    try {
        if (!fs.existsSync(dbPath)) return {};
        return JSON.parse(fs.readFileSync(dbPath, 'utf-8'));
    } catch {
        return {};
    }
};

const writeDb = (data) => {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
};

const resolveCanonicalCommand = (inputCmd) => {
    const cleanCmd = inputCmd.toLowerCase().replace(/^[.#/!]/, '');
    if (!global.commands) return cleanCmd;
    if (global.commands.has(cleanCmd)) return cleanCmd;
    if (global.aliases && global.aliases.has(cleanCmd)) {
        return global.aliases.get(cleanCmd);
    }
    return cleanCmd;
};

export const resCmdsModule = {
    category: 'owner',
    commands: {
        rescmds: {
            name: 'rescmd',
            alias: ['rescmds', 'restrictcmd', 'unrescmd'],
            rowner: true,
            run: async (m, { conn, args, usedPrefix, command }) => {
                if (!args[0]) return m.reply(`> ❒ *Uso correcto:*\n• Restringir: *${usedPrefix}${command} <comando> <razón>*\n• Liberar: *${usedPrefix}${command} <comando>*`);

                const rawCmd = args[0];
                const canonicalCmd = resolveCanonicalCommand(rawCmd);
                const reason = args.slice(1).join(' ').trim();
                const db = readDb();

                if (db[canonicalCmd]) {
                    if (!reason) {
                        delete db[canonicalCmd];
                        writeDb(db);
                        return m.reply(`> ❒ El comando *${usedPrefix}${canonicalCmd}* y todos sus alias han sido liberados.`);
                    } else {
                        db[canonicalCmd] = { razon: reason };
                        writeDb(db);
                        return m.reply(`> ❒ Razón actualizada para *${usedPrefix}${canonicalCmd}* (y sus alias):${reason}`);
                    }
                } else {
                    if (!reason) return m.reply(`> ❒ Para restringir *${usedPrefix}${canonicalCmd}* debes añadir una razón.`);
                    db[canonicalCmd] = { razon: reason };
                    writeDb(db);
                    return m.reply(`> ❒ Comando *${usedPrefix}${canonicalCmd}* y todos sus alias asociados fueron restringidos.\n*Motivo:*${reason}`);
                }
            }
        }
    }
};
