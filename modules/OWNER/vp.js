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

export const resCmdsModule = {
    category: 'owner',
    commands: {
        vipToggle: {
            name: 'vip',
            alias: ['setvip', 'togglefingvip'],
            rowner: true,
            run: async (m, { conn, usedPrefix, command }) => {
                const db = readDb();
                const currentState = db.vip === true ? true : false;
                const newState = !currentState;
                
                db.vip = newState;
                writeDb(db);
                
                return m.reply(`> ❒ El parámetro *vip* ha sido actualizado exitosamente.\n*Estado actual:* \`${newState}\``);
            }
        }
    }
};
