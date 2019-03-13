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

databench.on('keypoints', ({keypoint_sets, image_id}) => {
  console.log({keypoint_sets, image_id});
  captureBuffer.forEach(b => {
    if (b.image_id == image_id) {
      let i = new Image();
      i.onload = () => {
        contextOut.drawImage(i, 0, 0, canvasOut.width, canvasOut.height);
        keypoint_sets.forEach(({keypoints, detection_id}) => {
          contextOut.font = "12px Arial";
          contextOut.fillText(`detection ${detection_id}`,
                              keypoints[0][0] * canvasOut.width,
                              keypoints[0][1] * canvasOut.height);

          keypoints.forEach((xyv, joint_id) => {
            if (xyv[2] == 0.0) return;

            console.log({detection_id, xyv, joint_id});
            contextOut.fillStyle = '#0000ff';
            contextOut.fillRect(xyv[0] * canvasOut.width - 2,
                                xyv[1] * canvasOut.height - 2,
                                4, 4);
          });
        });
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
captureButton.addEventListener('click', newImage);

databench.connect();
