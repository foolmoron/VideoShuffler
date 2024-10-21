import express from 'express';
import cors from 'cors';
import https from 'https';
import ip from 'ip';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import session from 'express-session';
import config from './config.js';

const PUBLIC_VID_PATH = 'vids/';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb' }));
app.use(express.static('public'));
app.use(
    session({
        secret: config.SECRET,
        resave: true,
        saveUninitialized: true,
    })
);

const MAX_HISTORY = 30;
const history = [];
let historyIndex = undefined;

const HISTORY_COOLDOWN_MS = 1.2*1000;
let historyLastRequestMs = 0;

function isValidVideoPath(path) {
    return path.endsWith('.mp4') || path.endsWith('.webp')
}

async function getRandomVidPath() {
    const vids = (await fsp.readdir('./public/' + PUBLIC_VID_PATH)).filter(isValidVideoPath);
    return './vids/' + vids[Math.floor(Math.random() * vids.length)]
}

/** @type { {path: string, type?: 'INTERRUPT' | 'NEXT' | 'PREV'}[] } */
const interrupts = []
fs.watch('./public/' + PUBLIC_VID_PATH, (eventType, filename) => {
    if (!isValidVideoPath(filename)) {
        return;
    }
    const publicPath = PUBLIC_VID_PATH + filename;
    if (eventType === 'change' && !interrupts.find(i => i.path == publicPath)) {
        interrupts.push({
            path: publicPath,
            type: 'INTERRUPT',
        });
    }
});

app.get('/vid', async (req, res) => {
    const interrupt = interrupts.shift();
    if (interrupt) {
        res.json(interrupt);
    } else {
        if (historyIndex !== undefined) {
            history.length = historyIndex + 1;
        }
        historyIndex = undefined;
        const vidPath = await getRandomVidPath();
        res.json({
            path: vidPath,
        });
        history.push(vidPath);
        while (history.length > MAX_HISTORY) {
            history.shift();
        }
    }
});

app.get('/vid-prev', async (req, res) => {
    if (history.length == 0 || Date.now() - historyLastRequestMs <= HISTORY_COOLDOWN_MS) {
        res.status(429).send();
        return;
    }
    historyLastRequestMs = Date.now();

    if (historyIndex == undefined) {
        historyIndex = history.length;
    }
    if (historyIndex > 0) {
        historyIndex--;
    }
    interrupts.push({
        path: history[historyIndex],
        type: 'PREV',
    });

    res.send("OK")
});

app.get('/vid-next', async (req, res) => {
    if (Date.now() - historyLastRequestMs <= HISTORY_COOLDOWN_MS) {
        res.status(429).send();
        return;
    }
    historyLastRequestMs = Date.now();
    
    if (historyIndex != undefined && historyIndex < (history.length - 1)) {
        historyIndex++;
        interrupts.push({
            path: history[historyIndex],
            type: 'NEXT',
        });
    } else {
        interrupts.push({
            path: await getRandomVidPath(),
            type: 'NEXT',
        });
    }

    res.send("OK")
});

app.get('/interrupts', async (req, res) => {
    res.json(interrupts);
});

https
    .createServer(
        {
            key: fs.readFileSync(config.KEY_PATH),
            cert: fs.readFileSync(config.CERT_PATH),
        },
        app
    )
    .listen(config.HTTPS_PORT, function () {
        const addr = ip.address();
        const url = `https://${addr}:${config.HTTPS_PORT}`;
        console.log(`Listening on port ${config.HTTPS_PORT}`);
        console.log(`Click this: ${url}`);
    });