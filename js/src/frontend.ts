/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';

let backendLocation = '';
// if (document.location.search && document.location.search[0] === '?') {
//     backendLocation = document.location.search.substr(1);
// }
if (!backendLocation && document.location.hostname === 'openpifpaf.github.io') {
    backendLocation = 'https://vitademo.epfl.ch';
}

const fpsSpan = <HTMLSpanElement>document.getElementById('fps');
let fps = 0.0;
let lastProcessing: number = null;

const camera = new Camera(document.getElementById('capture'));
const vis = new Visualization(document.getElementById('visualization'));
const feedLink = <HTMLAnchorElement>document.getElementById('feedlink');
const url = new URL(document.location.href);

export async function newImage() {
    const data = await camera.imageData();

    const response = await fetch(backendLocation + '/v1/human-poses' + url.search, {
        method: 'post',
        mode: 'cors',
        body: data.image,
    });
    if (lastProcessing !== null) {
        const duration = Date.now() - lastProcessing;
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    const pred = await response.json();

    if (url.searchParams.get('channel') !== pred.channel) {
        url.searchParams.set('channel', pred.channel);
        // document.location.replace(url.toString());
        feedLink.href = '/v1/feed?channel=' + pred.channel;
        feedLink.text = pred.channel;
    }

    return [data.image, pred];
}


async function loopForever() {
    let prevImagePred = await newImage();
    while (true) {
        let [imagePred, _, __] = await Promise.all([
            newImage(),
            vis.draw(prevImagePred[0], prevImagePred[1]),
            new Promise<void>(resolve => requestAnimationFrame(() => resolve())),
        ]);
        prevImagePred = imagePred;
    }
}
loopForever();
