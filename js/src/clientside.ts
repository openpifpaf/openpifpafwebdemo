/* global document */

import { Camera } from './camera';
import { Visualization } from './visualization';
import * as onnx from 'onnxjs';
import * as ndarray from 'ndarray';
import * as ops from 'ndarray-ops';


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

    return vis.drawFields(image, pifC, pifR, pafC, pafR1, pafR2, 0.8);
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


// load the ONNX model
let session = null;
let modelLoaded = null;
const modelSelectorDiv = <HTMLDivElement>document.getElementById('model-selector');
function loadModel(modelData: {name: string, url: string}) {
    modelLoaded = null;

    session = new onnx.InferenceSession({backendHint: 'webgl'});
    session.loadModel(modelData.url).then(() => { modelLoaded = modelData; });
}

// wire up model selection ui
const inputElements = modelSelectorDiv.getElementsByTagName('input');
for (let radioElement of inputElements) {
    radioElement.onchange = (ev: any) => {
        console.log(radioElement.dataset);
        loadModel({name: radioElement.dataset.name, url: radioElement.dataset.url});
    };
}
inputElements[0].checked = true;
inputElements[0].onchange(null);


export async function newImageOnnx() {
    if (!modelLoaded) {
        console.log('model not loaded yet');
        await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
        return;
    }

    // generate model input
    const data = await c.imageData();
    const inferenceInputs = preProcess(c.captureContext);
    const [nBatch, nColors, height, width] = inferenceInputs.dims;
    if (height > width) {
        alert('use landscape mode');
        return;
    }

    // execute the model
    console.log('about to run new session');
    const startSession = Date.now();
    let output = null;
    try {
        output = await session.run([inferenceInputs]);
    } catch (err) {
        console.error(err.message);
        alert(err.message);
        return;
    }
    console.log({'nn done': Date.now() - startSession});
    if (lastProcessing != null) {
        const duration = Date.now() - lastProcessing;
        console.log({duration});
        fps = 0.5 * fps + 0.5 * (1000.0 / duration);
        fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();

    // process output
    await drawFields(data.image, output);
}


async function loopForever() {
    while (true) {
        await newImageOnnx();
        await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    }
}
loopForever();
