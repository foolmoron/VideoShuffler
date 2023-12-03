const vid1 = document.querySelector('#vid1');
const vid2 = document.querySelector('#vid2');

async function loopRandomVids() {
    let vid = vid1;
    let vidBuffer = vid2;
    vid.src = await fetch('./vid').then(res => res.text());
    while (true) {
        const src = await fetch('./vid').then(res => res.text());
        const onLoaded = new Promise(res => {
            vidBuffer.addEventListener('loadeddata', res, { once: true });
        })
        vidBuffer.src = src;
        vidBuffer.currentTime = 0;
        vidBuffer.pause();
        await new Promise(res => setTimeout(res, 5*1000));
        await onLoaded;
        [vid, vidBuffer] = [vidBuffer, vid];
        vid.classList.remove('hide');
        vidBuffer.classList.add('hide');
        vid.play();
    }
}
loopRandomVids();

async function playNewVid() {
}
playNewVid();
