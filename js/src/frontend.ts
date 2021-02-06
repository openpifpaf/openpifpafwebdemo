/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';

let backend_location = '';
// if (document.location.search && document.location.search[0] === '?') {
//     backend_location = document.location.search.substr(1);
// }
if (!backend_location && document.location.hostname === 'vita-epfl.github.io') {
    backend_location = 'https://vitademo.epfl.ch';
}

const fpsSpan = <HTMLSpanElement>document.getElementById('fps');
let fps = 0.0;
let lastProcessing: number = null;

const camera = new Camera(document.getElementById('capture'));
const vis = new Visualization(document.getElementById('visualization'));

export async function newImage() {
    const data = await camera.imageData();

    const response = await fetch(backend_location + '/v1/human-poses' + document.location.search, {
        method: 'post',
        mode: 'cors',
        body: data.image,
    });
    if (lastProcessing != null) {
        const duration = Date.now() - lastProcessing;
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    const pred = await response.json();
    return [data.image, pred];
}


async function loop_forever() {
    let prev_image_pred = await newImage();
    while (true) {
        let [image_pred, _, __] = await Promise.all([
            newImage(),
            vis.draw(prev_image_pred[0], prev_image_pred[1]),
            new Promise<void>(resolve => requestAnimationFrame(() => resolve())),
        ]);
        prev_image_pred = image_pred;
    }
}
loop_forever();
