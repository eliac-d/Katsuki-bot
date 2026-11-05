import chalk from 'chalk';
import readline from 'readline';
import util from 'util';

const stdout = process.stdout;

export const c = {
    accent: chalk.hex('#7c5cff'),
    cyan: chalk.hex('#00e5ff'),
    pink: chalk.hex('#ff4fd8'),
    ok: chalk.hex('#3ddc97'),
    warn: chalk.hex('#ffc857'),
    fail: chalk.hex('#ff5c7a'),
    dim: chalk.hex('#8b90a7')
};

const LOGO = [
    '█▀▄ ▀█▀ █ █',
    '█ █  █  ▀▄▀',
    '█▄▀ ▄█▄ █ █'
];

const GRADIENT = [c.cyan, c.accent, c.pink];

export const width = () => Math.max(30, Math.min((stdout.columns || 40) - 2, 46));

const center = (text, w, color = (s) => s) =>
    ' '.repeat(Math.max(0, Math.floor((w - text.length) / 2))) + color(text);

function wrap(text, w) {
    const words = String(text).split(/\s+/).filter(Boolean);
    const lines = [];
    let cur = '';
    for (const word of words) {
        if (!cur) { cur = word; continue; }
        if (cur.length + 1 + word.length <= w) cur += ` ${word}`;
        else { lines.push(cur); cur = word; }
    }
    if (cur) lines.push(cur);
    return lines;
}

export function box(rows, border = c.accent) {
    const w = width();
    const inner = w - 4;
    const out = [border(`╭${'─'.repeat(w - 2)}╮`)];
    for (const row of rows) {
        if (row.divider) {
            out.push(border(`├${'─'.repeat(w - 2)}┤`));
            continue;
        }
        const item = typeof row === 'string' ? { text: row } : row;
        const color = item.color || ((s) => s);
        const lines = item.text ? wrap(item.text, inner) : [''];
        for (const line of lines) {
            const space = Math.max(0, inner - line.length);
            const left = item.align === 'center' ? Math.floor(space / 2) : 0;
            out.push(`${border('│')} ${' '.repeat(left)}${color(line)}${' '.repeat(space - left)} ${border('│')}`);
        }
    }
    out.push(border(`╰${'─'.repeat(w - 2)}╯`));
    return out.join('\n');
}

export function printBanner() {
    const w = width();
    const lines = [''];
    LOGO.forEach((line, i) => lines.push(center(line, w, GRADIENT[i].bold)));
    lines.push(center('S Y S T E M', w, c.dim));
    lines.push(c.dim('─'.repeat(w)));
    lines.push(center('dix.lat', w, c.cyan));
    lines.push('');
    stdout.write(lines.join('\n') + '\n');
}

const time = () => c.dim(new Date().toTimeString().slice(0, 5));

const format = (args) => args
    .map((a) => (a instanceof Error ? (a.stack || a.message) : typeof a === 'string' ? a : util.inspect(a, { depth: 2 })))
    .join(' ');

const emit = (color, args) => stdout.write(`${time()} ${color('●')} ${format(args)}\n`);

export const log = {
    info: (...a) => emit(c.cyan, a),
    ok: (...a) => emit(c.ok, a),
    warn: (...a) => emit(c.warn, a),
    fail: (...a) => emit(c.fail, a)
};

export function ask(label) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        let answered = false;
        rl.on('close', () => { if (!answered) resolve(null); });
        stdout.write(`${c.accent('›')} ${chalk.bold(label)}\n`);
        rl.question(`${c.cyan('❯')} `, (answer) => {
            answered = true;
            rl.close();
            resolve(answer);
        });
    });
}

export function spinner(text) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;
    const tick = () => stdout.write(`\r${c.cyan(frames[i++ % frames.length])} ${text}\x1b[K`);
    tick();
    const timer = setInterval(tick, 80);
    return () => {
        clearInterval(timer);
        stdout.write('\r\x1b[K');
    };
}

export function pairingCard(code) {
    stdout.write('\n' + box([
        { text: 'CÓDIGO DE VINCULACIÓN', align: 'center', color: c.warn.bold },
        { divider: true },
        { text: code, align: 'center', color: c.cyan.bold },
        { divider: true },
        { text: 'WhatsApp > Dispositivos vinculados > Vincular con número de teléfono', align: 'center', color: c.dim }
    ]) + '\n\n');
}

export function onlineCard(number) {
    const n = String(number || '').split('@')[0];
    stdout.write('\n' + box([
        { text: 'ONLINE', align: 'center', color: c.ok.bold },
        { divider: true },
        { text: `Número  ${n}` },
        { text: `Hora    ${new Date().toTimeString().slice(0, 8)}` }
    ], c.ok) + '\n\n');
}