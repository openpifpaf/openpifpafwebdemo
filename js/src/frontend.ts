/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';

let backend_location = '';
if (document.location.search && document.location.search[0] === '?') {
    backend_location = document.location.search.substr(1);
}
if (!backend_location && document.location.hostname === 'vita-epfl.github.io') {
    backend_location = 'https://vitademo.epfl.ch';
}

const fpsSpan = <HTMLSpanElement>document.getElementById('fps');
let captureCounter = 0;
let fps = 0.0;
let lastProcessing: number = null;

const c = new Camera(document.getElementById('capture'));
const vis = new Visualization(document.getElementById('visualization'));

export async function newImage() {
    const data = c.imageData();

    const response = await fetch(backend_location + '/process', {
        method: 'post',
        mode: 'cors',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    });
    if (lastProcessing != null) {
        const duration = Date.now() - lastProcessing;
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    response.json().then(body => {
        console.log(body);
        vis.draw(data.image, body);
    });
}


async function loop_forever() {
    while (true) {
        await newImage();
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
}
loop_forever();
