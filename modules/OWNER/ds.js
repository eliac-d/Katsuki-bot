import { existsSync, promises as fs } from 'fs';
import path from 'path';

const MAIN_SESSION = path.resolve('./sessions/main');
const TMP_DIR = path.resolve('./tmp');
const LMDB_MODULE = path.resolve('./core/s/auth_lmdb.js');

async function cleanFolder(dir, keep = []) {
    if (!existsSync(dir)) return 0;
    let removed = 0;
    const entries = await fs.readdir(dir).catch(() => []);
    for (const entry of entries) {
        if (keep.includes(entry)) continue;
        await fs.rm(path.join(dir, entry), { recursive: true, force: true })
            .then(() => { removed++; })
            .catch(() => null);
    }
    return removed;
}

function sumResult(result) {
    let total = 0;
    for (const id in result) {
        if (typeof result[id] === 'number') total += result[id];
    }
    return total;
}

async function purgeSubbots() {
    const url = new URL(`file://${LMDB_MODULE}`).href;
    const lmdb = await import(url);
    return sumResult(lmdb.purgeAllSubbotsExceptCreds());
}

export const cleanSessionModule = {
    category: 'owner',
    commands: {
        ds: {
            name: 'ds',
            alias: ['cleansession', 'limpiar'],
            rowner: true,
            run: async (m, { isROwner }) => {
                if (!isROwner) return;

                try {
                    await m.react('🧹');

                    const mainRemoved = await cleanFolder(MAIN_SESSION, ['creds.json']);
                    const tmpRemoved = await cleanFolder(TMP_DIR);

                    let subbotsRemoved = 0;
                    let subbotsError = null;
                    try {
                        subbotsRemoved = await purgeSubbots();
                    } catch (e) {
                        subbotsError = e?.message || String(e);
                    }

                    const total = mainRemoved + tmpRemoved + subbotsRemoved;

                    let text = total === 0
                        ? '> *Sistema optimizado.*'
                        : `> ♛  *PURGA TOTAL FINALIZADA*\n\n` +
                          `✦  *Principal:* ${mainRemoved}\n` +
                          `✦  *SubBots:* ${subbotsRemoved}\n` +
                          `✦  *Temporales:* ${tmpRemoved}\n` +
                          `✧  *Total:* ${total}\n\n` +
                          `*DEYLIN ELÍAC - SYSTEM*`;

                    if (subbotsError) text += `\n\n> ⚠️ SubBots: ${subbotsError}`;

                    await m.reply(text);
                    await m.react('✅');
                } catch (e) {
                    await m.reply(`> ❌ ${e?.message || e}`);
                    await m.react('❌');
                }
            }
        }
    }
};
