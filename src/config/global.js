import { fileURLToPath } from 'url';
import chalk from 'chalk';
import path from 'path';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import axios from 'axios';
import moment from 'moment-timezone';
import { promises as fs } from 'fs';
import { jidNormalizedUser } from '@whiskeysockets/baileys';

Object.assign(global, { cheerio, fs, fetch, axios, moment });

const readApiKey = () => {
    try {
        const file = path.resolve(process.cwd(), 'sessions', 'apikey.json');
        const data = JSON.parse(fs.readFileSync(file, 'utf8'));
        return String(data?.apikey || '').trim();
    } catch {
        return '';
    }
};

global.apikey = readApiKey();
global.ch = '120363406846602793@newsletter';
global.rmr = String.fromCharCode(8206).repeat(850);

global.owner = [['50432955554'], ['5216711089134'], ['15614809253'], ['573133374132'], ['176742836768966']];
global.dev1 = ['50432955554'];
global.developer = 'Developed by dix.lat. ';
global.v = '5'