/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';
import * as onnx from "onnxjs";
import * as ndarray from 'ndarray';
import * as ops from 'ndarray-ops';


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


function drawFields(image: string, modelOutput) {
    const pifC: onnx.Tensor = modelOutput.get('pif_c');
    console.log({pifC});

    // adjust height of output canvas
    const landscape = pifC.dims[3] > pifC.dims[2];
    const targetSize = landscape ? vis.originalCanvasSize : vis.originalCanvasSize.slice().reverse();
    if (vis.canvas.width !== targetSize[0]) vis.canvas.width = targetSize[0];
    if (vis.canvas.height !== targetSize[1]) vis.canvas.height = targetSize[1];

    // draw on output canvas
    const canvasImage = new Image();
    canvasImage.onload = () => {
        vis.context.drawImage(canvasImage,
                               0, 0, vis.canvas.width, vis.canvas.height);

        for (let ii=0; ii < pifC.dims[2]; ++ii) {
            for (let jj=0; jj < pifC.dims[3]; ++jj) {
                let max_v = 0.0;
                // for (let kk=0; kk < pifC.dims[1]; ++kk) {
                for (let kk=5; kk < 6; ++kk) {
                    const v = <number>pifC.get(0, kk, ii, jj);
                    if (v > max_v) {
                        max_v = v;
                    }
                }
                if (max_v < 0.8) continue;

                vis.context.beginPath();
                vis.context.fillStyle = '#ffffff';
                vis.context.arc((jj + 0.5) * vis.canvas.width / pifC.dims[3],
                                (ii + 0.5) * vis.canvas.height / pifC.dims[2],
                                (max_v - 0.8) / 0.2 * vis.markerSize,
                                0, 2 * Math.PI);
                vis.context.fill();
            }
        }
    };
    canvasImage.src = image;
}



function preProcess(ctx: CanvasRenderingContext2D): onnx.Tensor {
    const imageData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    const { data, width, height } = imageData;
    const dataTensor = ndarray(data, [height, width, 4]);
    // const dataTensor = ndtranspose(dataTensorT);
    const dataProcessedTensor = ndarray(new Float32Array(width * height * 3), [1, 3, height, width]);
    ops.assign(dataProcessedTensor.pick(0, 0, null, null), dataTensor.pick(null, null, 0));
    ops.assign(dataProcessedTensor.pick(0, 1, null, null), dataTensor.pick(null, null, 1));
    ops.assign(dataProcessedTensor.pick(0, 2, null, null), dataTensor.pick(null, null, 2));
    ops.divseq(dataProcessedTensor, 255);
    ops.subseq(dataProcessedTensor.pick(0, 0, null, null), 0.485);
    ops.subseq(dataProcessedTensor.pick(0, 1, null, null), 0.456);
    ops.subseq(dataProcessedTensor.pick(0, 2, null, null), 0.406);
    ops.divseq(dataProcessedTensor.pick(0, 0, null, null), 0.229);
    ops.divseq(dataProcessedTensor.pick(0, 1, null, null), 0.224);
    ops.divseq(dataProcessedTensor.pick(0, 2, null, null), 0.225);
    const tensor = new onnx.Tensor(new Float32Array(3 * height * width), 'float32', [1, 3, height, width]);
    (tensor.data as Float32Array).set(dataProcessedTensor.data);
    return tensor;
}

let model_loaded = false;
// create a session
const session = new onnx.InferenceSession({backendHint: 'webgl'});
// load the ONNX model file
session.loadModel("static/openpifpaf-resnet50.onnx").then(() => { model_loaded = true; });


export async function newImageOnnx() {
    console.log({model_loaded});
    if (!model_loaded) {
        console.log('model not loaded yet');
        return;
    }
    console.log('getting a new image');

    // generate model input
    const data = c.imageData();
    const inferenceInputs = preProcess(c.captureContext);
    // execute the model
    console.log('about to run new session');
    const output = await session.run([inferenceInputs])
    console.log('nn done');
    if (lastProcessing != null) {
        const duration = Date.now() - lastProcessing;
        console.log({duration});
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    // process output
    drawFields(data.image, output);

    console.log('done');
}


async function loop_forever() {
    while (true) {
        await newImageOnnx();
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
        await new Promise(resolve => setTimeout(() => resolve(), 500));
    }
}
loop_forever();
