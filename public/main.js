/** @type { HTMLVideoElement } */
const vidMain = document.querySelector('#vid-main');
/** @type { HTMLParagraphElement } */
const textContainer = document.querySelector('#text-container');
/** @type { HTMLDivElement } */
const animationContainer = document.querySelector('#animation-container');

let doInterrupt = () => {}; // will be replaced with a promise resolve func

function retriggerAnimation(htmlElement) {
    htmlElement.style.animation = 'none';
    htmlElement.offsetHeight;
    htmlElement.style.animation = null;
}

async function loopRandomVids() {
    while (true) {
        const vidRes = await fetch('./vid').then(res => res.json());
        const vidSrc = vidRes.path;
        vidMain.src = vidSrc;

        if (vidRes.type) {
            animationContainer.dataset.type = vidRes.type;
            const delaySecs = vidRes.type === 'INTERRUPT' ? 3.6 : 1.2;
            await new Promise(res => setTimeout(res, delaySecs * 1000));
            delete animationContainer.dataset.type;
        }

        while (true) {
            try {
                await vidMain.play();
                break;
            } catch (e) {
                console.warn('Click anywhere in browser to play video');
                await new Promise(res => setTimeout(res, 0.5 * 1000));
            }
        }

        const [txt, signature] = await Promise.all([
            fetch(vidSrc + '.txt').then(res => res.ok ? res.text() : null),
            fetch(vidSrc + '.signature.txt').then(res => res.ok ? res.text() : 'Anonymous'),
        ]);
        let stopAnim = false;
        if (txt) {
            const long = txt.length >= 85;
            const words = txt.split(' ');
            const texts = [];
            const phrase = [];
            for (let i = 0; i < words.length; i++) {
                phrase.push(words[i]);
                if (i == words.length - 1 || phrase.length >= 4 || Math.random() > 0.75) {
                    texts.push(`<div class="phrase" style="margin-left: ${Math.random() * 5 - 1}rem; margin-right: ${Math.random() * 5 - 1}rem;">${phrase.join(' ')}</div>`);
                    phrase.length = 0;
                }
            }
            textContainer.classList.toggle('long', long);
            textContainer.innerHTML = texts.join(`<div class="spacing"></div>`) + `<div class="signature">~ ${signature}</div>`;
            for (const n of textContainer.childNodes) {
                n.style.visibility = 'hidden';
            }
            const animPromise = (async () => {
                await new Promise(res => setTimeout(res, 2.5 * 1000));
                for (const n of textContainer.childNodes) {
                    if (stopAnim) {
                        return;
                    }
                    n.style.visibility = null;
                    await new Promise(res => setTimeout(res, (Math.random() * 0.5 + 0.2) * (long ? 0.5 : 1.0) * 1000));
                }
            })();
        }

        retriggerAnimation(textContainer);

        const interruptPromise = new Promise((res, rej) => {
            doInterrupt = res;
        });
        const minDurationSecs = Math.max(20, vidMain.duration);
        await Promise.race([
            new Promise(res => setTimeout(res, minDurationSecs * 1000)),
            interruptPromise,
        ]);
        stopAnim = true;
        textContainer.innerHTML = '';
    }
}
loopRandomVids();

async function interruptWithNewVids() {
    while (true) {
        const interrupts = await fetch('./interrupts').then(res => res.json());
        if (interrupts.length != 0) {
            doInterrupt();
        }
        await new Promise(res => setTimeout(res, 0.4 * 1000));
    }
}
interruptWithNewVids();

async function playNewVid() {
}
playNewVid();
