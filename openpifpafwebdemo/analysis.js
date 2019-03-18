/* global Databench */
/* global document */

const databench = new Databench.Connection();
Databench.ui.wire(databench);
document.getElementById('resolution').databenchUI.sliderToValue = v => v / 100.0;
document.getElementById('resolution').databenchUI.valueToSlider = v => v * 100.0;
document.getElementById('resolution').databenchUI.formatFn = v => `${(v * 100).toFixed(0)}%`;

const video = document.getElementById('video');
const canvasCapture = document.getElementById('canvas-capture');
const contextCapture = canvasCapture.getContext('2d');
const canvasOut = document.getElementById('canvas-out');
const contextOut = canvasOut.getContext('2d');
const captureButton = document.getElementById('capture');
let captureCounter = 0;
let captureBuffer = [];

const capabilities = { audio: false, video: { width: 320, height: 240 } };
navigator.mediaDevices.getUserMedia(capabilities).then(
  (stream) => video.srcObject = stream
);


databench.on({ data: 'pi' }, (pi) => {
  document.getElementById('pi').innerHTML =
    `${pi.estimate.toFixed(3)} ± ${pi.uncertainty.toFixed(3)}`;
});

databench.on({ data: 'fps' }, fps => {
  document.getElementById('fps').innerHTML = fps.toFixed(1);
});


COCO_PERSON_SKELETON = [
  [16, 14], [14, 12], [17, 15], [15, 13], [12, 13], [6, 12], [7, 13],
  [6, 7], [6, 8], [7, 9], [8, 10], [9, 11], [2, 3], [1, 2], [1, 3],
  [2, 4], [3, 5], [4, 6], [5, 7]];
COLORS = [
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

  COCO_PERSON_SKELETON.forEach((joint_pair, connection_index) => {
    const [joint1i, joint2i] = joint_pair;
    console.log({joint1i, joint2i});
    console.log({keypoints});
    const joint1xyv = keypoints[joint1i - 1];
    const joint2xyv = keypoints[joint2i - 1];
    console.log({joint1xyv, joint2xyv});
    const color = COLORS[connection_index % COLORS.length];
    contextOut.strokeStyle = color;
    contextOut.lineWidth = 5;
    if (joint1xyv[2] < 0.05 || joint2xyv[2] < 0.05) return;

    contextOut.beginPath();
    contextOut.moveTo(joint1xyv[0] * canvasOut.width, joint1xyv[1] * canvasOut.height);
    contextOut.lineTo(joint2xyv[0] * canvasOut.width, joint2xyv[1] * canvasOut.height);
    contextOut.stroke();
  });

  keypoints.forEach((xyv, joint_id) => {
    if (xyv[2] < 0.05) return;

    console.log({detection_id, xyv, joint_id});
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


databench.on('keypoints', ({keypoint_sets, image_id}) => {
  console.log({keypoint_sets, image_id});
  captureBuffer.forEach(b => {
    if (b.image_id == image_id) {
      let i = new Image();
      i.onload = () => {
        contextOut.drawImage(i, 0, 0, canvasOut.width, canvasOut.height);
        keypoint_sets.forEach(({keypoints, detection_id}) => drawSkeleton(keypoints, detection_id));
      };
      i.src = b.image;
    }
  });
  captureBuffer = captureBuffer.filter(b => b.image_id >= image_id);
});


function newImage() {
  contextCapture.drawImage(video, 0, 0, canvasCapture.width, canvasCapture.height);
  captureCounter += 1;
  databench.emit('image', {image_id: captureCounter, image: canvasCapture.toDataURL()});
  captureBuffer.push({image_id: captureCounter, image: canvasCapture.toDataURL()});
}

databench.on('idle', newImage);

databench.connect();
newImage();  // kick it off
