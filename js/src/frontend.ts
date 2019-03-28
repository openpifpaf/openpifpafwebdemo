/* global document */

let backend_location = (document.location.search && document.location.search[0] == '?') ? document.location.search.substr(1) : '';
if (!backend_location && document.location.hostname == 'github') {
  backend_location = 'https://vitapc11.epfl.ch';
}

const video = <HTMLVideoElement>document.getElementById('video');
const canvasCapture = <HTMLCanvasElement>document.getElementById('canvas-capture');
const contextCapture = canvasCapture.getContext('2d');
const canvasOut = <HTMLCanvasElement>document.getElementById('canvas-out');
const contextOut = canvasOut.getContext('2d');
const fpsSpan = <HTMLSpanElement>document.getElementById('fps');
let captureCounter = 0;
let fps = 0.0;
let lastProcessing: number = null;


const capabilities = { audio: false, video: { width: 640, height: 480 } };
navigator.mediaDevices.getUserMedia(capabilities).then(
  (stream) => video.srcObject = stream
);


const COCO_PERSON_SKELETON = [
  [16, 14], [14, 12], [17, 15], [15, 13], [12, 13], [6, 12], [7, 13],
  [6, 7], [6, 8], [7, 9], [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
  [2, 4], [3, 5], [4, 6], [5, 7]];
const COLORS = [
  "#1f77b4",
  "#aec7e8",
  "#ff7f0e",
  "#ffbb78",
  "#2ca02c",
  "#98df8a",
  "#d62728",
  "#ff9896",
  "#9467bd",
  "#c5b0d5",
  "#8c564b",
  "#c49c94",
  "#e377c2",
  "#f7b6d2",
  "#7f7f7f",
  "#c7c7c7",
  "#bcbd22",
  "#dbdb8d",
  "#17becf",
  "#9edae5",
];


function drawSkeleton(keypoints, detection_id) {
  // contextOut.font = "12px Arial";
  // contextOut.fillText(`detection ${detection_id}`,
  //                     keypoints[0][0] * canvasOut.width,
  //                     keypoints[0][1] * canvasOut.height);
  console.log({keypoints, detection_id});

  COCO_PERSON_SKELETON.forEach((joint_pair, connection_index) => {
    const [joint1i, joint2i] = joint_pair;
    const joint1xyv = keypoints[joint1i - 1];
    const joint2xyv = keypoints[joint2i - 1];
    const color = COLORS[connection_index % COLORS.length];
    contextOut.strokeStyle = color;
    contextOut.lineWidth = 5;
    if (joint1xyv[2] == 0.0 || joint2xyv[2] == 0.0) return;

    contextOut.beginPath();
    contextOut.moveTo(joint1xyv[0] * canvasOut.width, joint1xyv[1] * canvasOut.height);
    contextOut.lineTo(joint2xyv[0] * canvasOut.width, joint2xyv[1] * canvasOut.height);
    contextOut.stroke();
  });

  keypoints.forEach((xyv, joint_id) => {
    if (xyv[2] == 0.0) return;

    contextOut.beginPath();
    contextOut.fillStyle = '#ffffff';
    contextOut.arc(xyv[0] * canvasOut.width,
                   xyv[1] * canvasOut.height,
                   2,
                   0,
                   2 * Math.PI);
    contextOut.fill();
  });
}


export function newImage() {
  contextCapture.drawImage(video, 0, 0, canvasCapture.width, canvasCapture.height);
  captureCounter += 1;
  const data = {image_id: captureCounter, image: canvasCapture.toDataURL()};

  let xhr = new XMLHttpRequest();
  xhr.open('POST', backend_location + '/process', true);
  xhr.onload = function() {
    if (lastProcessing != null) {
      const duration = Date.now() - lastProcessing;
      fps = 0.9 * fps + 0.1 * (1000.0 / duration);
      fpsSpan.textContent = `${fps.toFixed(1)}`;
    }
    lastProcessing = Date.now();
    newImage();
    const body = JSON.parse(this['responseText']);
    const scores = body.map((entry: any) => entry.score);

    // console.log({'canvaswidth': [canvasOut.clientWidth, canvasOut.scrollWidth], 'videoheight': video.videoHeight, 'videowidth': video.videoWidth});
    const targetHeight = Math.round(canvasOut.clientWidth * video.videoHeight / video.videoWidth);
    if (canvasOut.clientHeight != targetHeight) {
      canvasOut.height = targetHeight;
    }
    // console.log({r: Math.round(canvasOut.clientWidth * video.videoHeight / video.videoWidth), canvasheight: canvasOut.height});
    let i = new Image();
    i.onload = () => {
      contextOut.drawImage(i, 0, 0, canvasOut.width, canvasOut.height);
      body.forEach((entry: any) => drawSkeleton(entry.coordinates, entry.detection_id));
    };
    i.src = data.image;
  };
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

newImage();  // kick it off
