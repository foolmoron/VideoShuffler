import express from 'express';
import cors from 'cors';
import https from 'https';
import ip from 'ip';
import fs from 'fs';
import fsp from 'fs/promises';
import session from 'express-session';
import config from './config.js';

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
    const vids = await fsp.readdir('./public/vids');
    const vid = vids[Math.floor(Math.random() * vids.length)];
    res.send('./vids/' + vid);
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