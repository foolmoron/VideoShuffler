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

app.get('/vid', async (req, res) => {
    const vids = await fsp.readdir('./public/' + PUBLIC_VID_PATH);
    const vid = vids[Math.floor(Math.random() * vids.length)];
    res.send('./vids/' + vid);
});

const interrupts = []
fs.watch('./public/' + PUBLIC_VID_PATH, (eventType, filename) => {
    if (!filename.endsWith('.mp4') & !filename.endsWith('.webp')) {
        return;
    }
    const publicPath = PUBLIC_VID_PATH + filename;
    if (eventType === 'change' && !interrupts.includes(publicPath)) {
        interrupts.push(publicPath);
    }
});

app.get('/interrupts', async (req, res) => {
    res.json(interrupts);
});

app.delete('/interrupts/:filename', async (req, res) => {
    const index = interrupts.indexOf(req.params.filename);
    if (index !== -1) {
        interrupts.splice(index, 1);
        res.send('OK');
    } else {
        res.status(404).send('Not found');
    }
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