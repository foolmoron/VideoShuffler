/** @type { HTMLVideoElement } */
const vidMain = document.querySelector('#vid-main');
/** @type { HTMLVideoElement } */
const vidInterrupt = document.querySelector('#vid-interrupt');

async function loopRandomVids() {
    while (true) {
        vidMain.src = await fetch('./vid').then(res => res.text());
        while (true) {
            try {
                await vidMain.play();
                break;
            } catch (e) {
                console.warn('Click anywhere in browser to play video');
                await new Promise(res => setTimeout(res, 0.5 * 1000));
            }
        }
        await new Promise(res => vidMain.addEventListener('loadeddata', res, {once: true}));
        const minDurationSecs = Math.max(60, vidMain.duration);
        await new Promise(res => setTimeout(res, minDurationSecs * 1000));
    }
}
loopRandomVids();

async function interruptWithNewVids() {
    while (true) {
        const interrupts = await fetch('./interrupts').then(res => res.json());
        if (interrupts.length === 0) {
            await new Promise(res => setTimeout(res, 3 * 1000));
        } else {
            vidMain.pause();
            vidInterrupt.classList.remove('hide');
            for (const interrupt of interrupts) {
                vidInterrupt.src = interrupt;
                vidInterrupt.currentTime = 0;
                while (true) {
                    try {
                        await vidInterrupt.play();
                        break;
                    } catch (e) {
                        console.warn('Click anywhere in browser to play video');
                        await new Promise(res => setTimeout(res, 0.5 * 1000));
                    }
                }
                await fetch('./interrupts/' + encodeURIComponent(interrupt), {method: 'DELETE'});
                await new Promise(res => setTimeout(res, 60 * 1000));
            }
            vidInterrupt.pause();
            vidInterrupt.classList.add('hide');
            vidMain.play();
        }
    }
}
interruptWithNewVids();

async function playNewVid() {
}
playNewVid();
