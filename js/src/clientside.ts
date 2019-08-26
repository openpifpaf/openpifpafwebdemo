/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';
import * as onnx from 'onnxjs';
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
vis.markerSize = 10;


function drawFields(image: string, modelOutput) {
    const pifC: onnx.Tensor = modelOutput.get('pif_c');
    const pifR: onnx.Tensor = modelOutput.get('pif_r');
    const pafC: onnx.Tensor = modelOutput.get('paf_c');
    const pafR1: onnx.Tensor = modelOutput.get('paf_r1');
    const pafR2: onnx.Tensor = modelOutput.get('paf_r2');
    console.log({pifC});

    // adjust height of output canvas
    const landscape = pifC.dims[3] > pifC.dims[2];
    const targetSize = landscape ? vis.originalCanvasSize : vis.originalCanvasSize.slice().reverse();
    if (vis.canvas.width !== targetSize[0]) vis.canvas.width = targetSize[0];
    if (vis.canvas.height !== targetSize[1]) vis.canvas.height = targetSize[1];

    const connectionColors = [
        '#1f77b4',
        '#aec7e8',
        '#ff7f0e',
        '#ffbb78',
        '#2ca02c',
        '#98df8a',
        '#d62728',
        '#ff9896',
        '#9467bd',
        '#c5b0d5',
        '#8c564b',
        '#c49c94',
        '#e377c2',
        '#f7b6d2',
        '#7f7f7f',
        '#c7c7c7',
        '#bcbd22',
        '#dbdb8d',
        '#17becf',
        '#9edae5',
    ]

    // draw on output canvas
    const canvasImage = new Image();
    canvasImage.onload = () => {
        vis.context.drawImage(canvasImage, 0, 0, vis.canvas.width, vis.canvas.height);

        for (let ii = 0; ii < pafC.dims[2]; ++ii) {
            for (let jj = 0; jj < pafC.dims[3]; ++jj) {
                for (let kk=0; kk < pafC.dims[1]; ++kk) {
                    const v = <number>pafC.get(0, kk, ii, jj);
                    if (v < 0.8) continue;

                    const fx1 = jj + <number>pafR1.get(0, kk, 0, ii, jj);
                    const fy1 = ii + <number>pafR1.get(0, kk, 1, ii, jj);
                    const fx2 = jj + <number>pafR2.get(0, kk, 0, ii, jj);
                    const fy2 = ii + <number>pafR2.get(0, kk, 1, ii, jj);

                    vis.context.beginPath()
                    vis.context.lineWidth = vis.lineWidth;
                    vis.context.strokeStyle = connectionColors[kk];
                    vis.context.moveTo(fx1 * vis.canvas.width / (pifC.dims[3] - 1),
                                       fy1 * vis.canvas.height / (pifC.dims[2] - 1));
                    vis.context.lineTo(fx2 * vis.canvas.width / (pifC.dims[3] - 1),
                                       fy2 * vis.canvas.height / (pifC.dims[2] - 1));
                    vis.context.stroke();
                }
            }
        }

        for (let ii = 0; ii < pifC.dims[2]; ++ii) {
            for (let jj = 0; jj < pifC.dims[3]; ++jj) {
                for (let ll=0; ll < pifC.dims[1]; ++ll) {
                    const v = <number>pifC.get(0, ll, ii, jj);
                    if (v < 0.8) continue;

                    vis.context.beginPath();
                    vis.context.fillStyle = '#fff';
                    const fx = jj + <number>pifR.get(0, ll, 0, ii, jj);
                    const fy = ii + <number>pifR.get(0, ll, 1, ii, jj);
                    vis.context.arc(fx * vis.canvas.width / (pifC.dims[3] - 1),
                                    fy * vis.canvas.height / (pifC.dims[2] - 1),
                                    (v - 0.8) / 0.2 * vis.markerSize,
                                    0, 2 * Math.PI);
                    vis.context.fill();
                }
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
    console.log({width, height});
    return tensor;
}

let model_loaded = false;
// create a session
const session = new onnx.InferenceSession({backendHint: 'webgl'});
// load the ONNX model file
session.loadModel('static/openpifpaf-resnet50.onnx').then(() => { model_loaded = true; });
// session.loadModel('static/openpifpaf-shufflenetv2x2.onnx').then(() => { model_loaded = true; });


export async function newImageOnnx() {
    if (!model_loaded) {
        console.log('model not loaded yet');
        await new Promise(resolve => setTimeout(() => resolve(), 200));
        return;
    }

    // generate model input
    const data = c.imageData();
    const inferenceInputs = preProcess(c.captureContext);
    // execute the model
    console.log('about to run new session');
    const startSession = Date.now()
    const output = await session.run([inferenceInputs]);
    console.log({'nn done': Date.now() - startSession});
    if (lastProcessing != null) {
        const duration = Date.now() - lastProcessing;
        console.log({duration});
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    // process output
    drawFields(data.image, output);
}


async function loop_forever() {
    while (true) {
        await newImageOnnx();
        await new Promise(resolve => requestAnimationFrame(() => resolve()));
    }
}
loop_forever();
