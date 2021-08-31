(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["openpifpafwebdemo"] = factory();
	else
		root["openpifpafwebdemo"] = factory();
})(self, function() {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./js/src/camera.ts":
/*!**************************!*\
  !*** ./js/src/camera.ts ***!
  \**************************/
/***/ (function(__unused_webpack_module, exports) {


var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Camera = void 0;
const defaultCapabilities = { audio: false, video: { width: 640, height: 480 } };
class Camera {
    constructor(ui) {
        this.ui = ui;
        this.video = ui.getElementsByTagName('video')[0];
        this.captureCanvas = ui.getElementsByTagName('canvas')[0];
        this.originalCaptureCanvasSize = [this.captureCanvas.width,
            this.captureCanvas.height];
        this.captureContext = this.captureCanvas.getContext('2d');
        this.buttonNextCamera = ui.getElementsByClassName('nextCamera')[0];
        this.buttonScreenCapture = ui.getElementsByClassName('screenCapture')[0];
        this.captureCounter = 0;
        this.modes = ['user', 'environment', 'screen'];
        this.mode = null;
        this.setCamera('user');
        this.buttonNextCamera.onclick = this.nextCamera.bind(this);
        this.buttonScreenCapture.onclick = this.screenCapture.bind(this);
    }
    setCamera(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mode === this.mode)
                return;
            this.mode = mode;
            let stream = null;
            if (['user', 'environment'].includes(this.mode)) {
                let capabilities = Object.assign(Object.assign({}, defaultCapabilities), { video: Object.assign(Object.assign({}, defaultCapabilities.video), { facingMode: this.mode }) });
                stream = yield navigator.mediaDevices.getUserMedia(capabilities);
            }
            else {
                // @ts-ignore
                stream = yield navigator.mediaDevices.getDisplayMedia({
                    video: {
                        cursor: 'never',
                        logicalSurface: true,
                        width: this.captureCanvas.width,
                    },
                    audio: false,
                });
            }
            this.video.srcObject = stream;
        });
    }
    imageData() {
        return __awaiter(this, void 0, void 0, function* () {
            // update capture canvas size
            const landscape = this.video.clientWidth > this.video.clientHeight;
            const targetSize = landscape ? this.originalCaptureCanvasSize : this.originalCaptureCanvasSize.slice().reverse();
            if (this.captureCanvas.width !== targetSize[0])
                this.captureCanvas.width = targetSize[0];
            if (this.captureCanvas.height !== targetSize[1])
                this.captureCanvas.height = targetSize[1];
            // capture
            this.captureCounter += 1;
            // draw
            this.captureContext.save();
            if (this.mode === 'user') {
                this.captureContext.translate(this.captureCanvas.width, 0);
                this.captureContext.scale(-1, 1);
            }
            this.captureContext.drawImage(this.video, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
            this.captureContext.restore();
            let image = null;
            yield new Promise(resolve => this.captureCanvas.toBlob(blob => {
                image = blob;
                resolve();
            }));
            return { imageId: this.captureCounter, image: image };
        });
    }
    nextCamera() {
        const facingMode = this.mode === 'environment' ? 'user' : 'environment';
        this.setCamera(facingMode);
    }
    screenCapture() {
        this.setCamera('screen');
    }
}
exports.Camera = Camera;


/***/ }),

/***/ "./js/src/frontend.ts":
/*!****************************!*\
  !*** ./js/src/frontend.ts ***!
  \****************************/
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


/* global document */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.newImage = void 0;
const camera_1 = __webpack_require__(/*! ./camera */ "./js/src/camera.ts");
const visualization_1 = __webpack_require__(/*! ./visualization */ "./js/src/visualization.ts");
let backendLocation = '';
// if (document.location.search && document.location.search[0] === '?') {
//     backendLocation = document.location.search.substr(1);
// }
if (!backendLocation && document.location.hostname === 'openpifpaf.github.io') {
    backendLocation = 'https://vitademo.epfl.ch';
}
const fpsSpan = document.getElementById('fps');
let fps = 0.0;
let lastProcessing = null;
const camera = new camera_1.Camera(document.getElementById('capture'));
const vis = new visualization_1.Visualization(document.getElementById('visualization'));
const feedLink = document.getElementById('feedlink');
const url = new URL(document.location.href);
function newImage() {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield camera.imageData();
        const response = yield fetch(backendLocation + '/v1/human-poses' + url.search, {
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
        const pred = yield response.json();
        if (url.searchParams.get('channel') !== pred.channel) {
            url.searchParams.set('channel', pred.channel);
            // document.location.replace(url.toString());
            feedLink.href = '/v1/feed?channel=' + pred.channel;
            feedLink.text = pred.channel;
        }
        return [data.image, pred];
    });
}
exports.newImage = newImage;
function loopForever() {
    return __awaiter(this, void 0, void 0, function* () {
        let prevImagePred = yield newImage();
        while (true) {
            let [imagePred, _, __] = yield Promise.all([
                newImage(),
                vis.draw(prevImagePred[0], prevImagePred[1]),
                new Promise(resolve => requestAnimationFrame(() => resolve())),
            ]);
            prevImagePred = imagePred;
        }
    });
}
loopForever();


/***/ }),

/***/ "./js/src/visualization.ts":
/*!*********************************!*\
  !*** ./js/src/visualization.ts ***!
  \*********************************/
/***/ ((__unused_webpack_module, exports) => {


Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.Visualization = void 0;
const COCO_PERSON_SKELETON = [
    [16, 14], [14, 12], [17, 15], [15, 13], [12, 13], [6, 12], [7, 13],
    [6, 7], [6, 8], [7, 9], [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
    [2, 4], [3, 5], [4, 6], [5, 7]
];
const COLORS = [
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
];
class Visualization {
    constructor(ui) {
        this.canvas = ui.getElementsByTagName('canvas')[0];
        this.originalCanvasSize = [this.canvas.width, this.canvas.height];
        this.context = this.canvas.getContext('2d');
        this.lineWidth = 10;
        this.markerSize = 4;
    }
    draw(image, data) {
        if (data === null)
            return;
        console.log(data);
        const annotations = data.annotations;
        // adjust height of output canvas
        if (data && data.length > 0) {
            const widthHeight = data.annotations[0].widthHeight;
            const landscape = widthHeight[0] > widthHeight[1];
            const targetSize = landscape ? this.originalCanvasSize : this.originalCanvasSize.slice().reverse();
            if (this.canvas.width !== targetSize[0])
                this.canvas.width = targetSize[0];
            if (this.canvas.height !== targetSize[1])
                this.canvas.height = targetSize[1];
        }
        // draw on output canvas
        const canvasImage = new Image();
        return new Promise((resolve, reject) => {
            canvasImage.onload = () => {
                this.context.drawImage(canvasImage, 0, 0, this.canvas.width, this.canvas.height);
                annotations.forEach((annotation) => this.drawSkeleton(annotation));
                resolve();
            };
            canvasImage.onerror = () => reject();
            // canvasImage.src = image;
            canvasImage.src = URL.createObjectURL(image);
        });
    }
    drawSkeletonLines(keypoints) {
        COCO_PERSON_SKELETON.forEach((jointPair, connectionIndex) => {
            const [joint1i, joint2i] = jointPair;
            const joint1xyv = keypoints[joint1i - 1];
            const joint2xyv = keypoints[joint2i - 1];
            const color = COLORS[connectionIndex % COLORS.length];
            this.context.strokeStyle = color;
            this.context.lineWidth = this.lineWidth;
            if (joint1xyv[2] === 0.0 || joint2xyv[2] === 0.0)
                return;
            this.context.beginPath();
            this.context.moveTo(joint1xyv[0] * this.canvas.width, joint1xyv[1] * this.canvas.height);
            this.context.lineTo(joint2xyv[0] * this.canvas.width, joint2xyv[1] * this.canvas.height);
            this.context.stroke();
        });
    }
    drawSkeleton(annotation) {
        this.drawSkeletonLines(annotation.keypoints);
        annotation.keypoints.forEach((xyv, jointId) => {
            if (xyv[2] === 0.0)
                return;
            this.context.beginPath();
            this.context.fillStyle = '#ffffff';
            this.context.arc(xyv[0] * this.canvas.width, xyv[1] * this.canvas.height, this.markerSize, 0, 2 * Math.PI);
            this.context.fill();
        });
    }
    drawFields(image, pifC, pifR, pafC, pafR1, pafR2, threshold) {
        // adjust height of output canvas
        const landscape = pifC.dims[3] > pifC.dims[2];
        const targetSize = landscape ? this.originalCanvasSize : this.originalCanvasSize.slice().reverse();
        if (this.canvas.width !== targetSize[0])
            this.canvas.width = targetSize[0];
        if (this.canvas.height !== targetSize[1])
            this.canvas.height = targetSize[1];
        // draw on output canvas
        const canvasImage = new Image();
        return new Promise((resolve, reject) => {
            canvasImage.onload = () => {
                this.context.drawImage(canvasImage, 0, 0, this.canvas.width, this.canvas.height);
                const xScale = this.canvas.width / (pifC.dims[3] - 1);
                const yScale = this.canvas.height / (pifC.dims[2] - 1);
                let pafCounter = 0;
                for (let ii = 0; ii < pafC.dims[2]; ++ii) {
                    for (let jj = 0; jj < pafC.dims[3]; ++jj) {
                        for (let kk = 0; kk < pafC.dims[1]; ++kk) {
                            const v = pafC.get(0, kk, ii, jj);
                            if (v < threshold)
                                continue;
                            pafCounter += 1;
                            const fx1 = jj + pafR1.get(0, kk, 0, ii, jj);
                            const fy1 = ii + pafR1.get(0, kk, 1, ii, jj);
                            const fx2 = jj + pafR2.get(0, kk, 0, ii, jj);
                            const fy2 = ii + pafR2.get(0, kk, 1, ii, jj);
                            this.context.beginPath();
                            this.context.lineWidth = this.lineWidth;
                            this.context.strokeStyle = COLORS[kk];
                            this.context.moveTo(fx1 * xScale, fy1 * yScale);
                            this.context.lineTo(fx2 * xScale, fy2 * yScale);
                            this.context.stroke();
                        }
                    }
                }
                let pifCounter = 0;
                for (let ii = 0; ii < pifC.dims[2]; ++ii) {
                    for (let jj = 0; jj < pifC.dims[3]; ++jj) {
                        for (let ll = 0; ll < pifC.dims[1]; ++ll) {
                            const v = pifC.get(0, ll, ii, jj);
                            if (v < threshold)
                                continue;
                            pifCounter += 1;
                            this.context.beginPath();
                            this.context.fillStyle = '#fff';
                            const fx = jj + pifR.get(0, ll, 0, ii, jj);
                            const fy = ii + pifR.get(0, ll, 1, ii, jj);
                            this.context.arc(fx * xScale, fy * yScale, (v - threshold) / threshold * this.markerSize, 0, 2 * Math.PI);
                            this.context.fill();
                        }
                    }
                }
                console.log({ pifCounter, pafCounter });
                resolve();
            };
            canvasImage.onerror = () => reject();
            canvasImage.src = image;
        });
    }
}
exports.Visualization = Visualization;


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__("./js/src/frontend.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});
//# sourceMappingURL=frontend.js.map