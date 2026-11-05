import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { box, ask, spinner, log, c } from './dix-ui.js';

const FILE = path.resolve(process.cwd(), 'sessions', 'apikey.json');
const VERIFY_URL = 'https://dix.lat/v1/verify';
const KEY_RE = /^dix_[a-zA-Z0-9_-]{3,32}$/;

function clean(value) {
    let key = String(value || '').trim().replace(/^["'`]+|["'`]+$/g, '').replace(/\s+/g, '');
    if (!key) return '';
    if (key.toLowerCase().startsWith('dix_')) return `dix_${key.slice(4)}`;
    return `dix_${key}`;
}

const mask = (key) => (key.length <= 10 ? 'dix_••••' : `${key.slice(0, 6)}••••${key.slice(-3)}`);

function readSaved() {
    try {
        const data = JSON.parse(fs.readFileSync(FILE, 'utf8'));
        const key = clean(data?.apikey);
        return KEY_RE.test(key) ? key : null;
    } catch {
        return null;
    }
}

function save(key) {
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify({ apikey: key, savedAt: new Date().toISOString() }, null, 2), { mode: 0o600 });
}

async function verify(key) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    try {
        const res = await fetch(`${VERIFY_URL}?apikey=${encodeURIComponent(key)}`, { signal: ctrl.signal });
        if (!res.ok) return null;
        const text = (await res.text()).trim().toLowerCase();
        if (text === 'true') return true;
        if (text === 'false') return false;
        return null;
    } catch {
        return null;
    } finally {
        clearTimeout(timer);
    }
}

function showIntro() {
    process.stdout.write(box([
        { text: 'API KEY REQUERIDA', align: 'center', color: c.warn.bold },
        { divider: true },
        'Algunas funciones del bot, como buscar y descargar contenido, necesitan una API Key para funcionar bien.',
        '',
        { text: 'Cómo obtenerla', color: c.cyan.bold },
        '1. Entra a https://dix.lat/login',
        '2. Inicia sesión o crea tu cuenta',
        '3. Copia tu API Key (dix_...)',
        '4. Pégala aquí abajo y pulsa Enter'
    ]) + '\n\n');
}

export async function ensureApiKey() {
    const saved = readSaved();
    if (saved) {
        global.apikey = saved;
        log.ok(`API Key cargada ${chalk.gray(mask(saved))}`);
        return saved;
    }

    let pending = clean(process.env.DIX_APIKEY) || null;
    if (!pending) showIntro();

    while (true) {
        const answer = pending ?? await ask('Pega tu API Key');
        pending = null;

        if (answer === null) {
            log.fail('No hay entrada disponible para pedir la API Key.');
            process.exit(1);
        }

        const key = clean(answer);
        if (!KEY_RE.test(key)) {
            log.warn('Formato inválido. Debe verse así: dix_xxxxxxxx');
            continue;
        }

        const stop = spinner('Verificando API Key...');
        const result = await verify(key);
        stop();

        if (result === true) {
            save(key);
            global.apikey = key;
            log.ok(`API Key verificada y guardada ${chalk.gray(mask(key))}`);
            return key;
        }

        if (result === false) log.fail('Esa API Key no está registrada. Revisa que la copiaste completa.');
        else log.warn('No se pudo conectar con dix.lat. Revisa tu internet e inténtalo de nuevo.');
    }
}