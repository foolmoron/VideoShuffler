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

const AUTORELOAD_MILLISECS = 10*60*1000;
const loadTime = Date.now();

async function loopRandomVids() {
    while (true) {
        if ((Date.now() - loadTime) > AUTORELOAD_MILLISECS) {
            location.reload();
            return;
        }

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
            textContainer.innerHTML = Array.from(txt).map(c => `<span>${c}</span>`).join('');
            textContainer.innerHTML += '<br><div style="position: absolute; right: 8vw; top: 80vh;">' + Array.from(`reported by ${signature}`).map(c => `<span>${c}</span>`).join('') + '</div>';
            const animPromise = (async () => {
                await new Promise(res => setTimeout(res, 2.5 * 1000));
                for (const n of textContainer.querySelectorAll('span')) {
                    if (stopAnim) {
                        return;
                    }
                    n.style.opacity = 1;
                    await new Promise(res => setTimeout(res, (Math.random() * 0.08 + 0.12) * 1000));
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
