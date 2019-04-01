const defaultCapabilities: MediaStreamConstraints = { audio: false, video: { width: 640, height: 480 } };


export class Camera {
    ui: HTMLElement;
    video: HTMLVideoElement;
    captureCanvas: HTMLCanvasElement;
    captureContext: CanvasRenderingContext2D;
    buttonNextCamera: HTMLButtonElement;
    currentCamera?: string;
    captureCounter: number;
    cameraIds: string[];
    cameraId?: string;

    constructor(ui: HTMLElement) {
        this.ui = ui;
        this.video = ui.getElementsByTagName('video')[0];
        this.captureCanvas = ui.getElementsByTagName('canvas')[0];
        this.captureContext = this.captureCanvas.getContext('2d');
        this.buttonNextCamera = <HTMLButtonElement>ui.getElementsByClassName('nextCamera')[0];
        this.captureCounter = 0;
        navigator.mediaDevices.enumerateDevices().then(devices => {
            this.cameraIds = devices
                .filter(device => device.kind === 'videoinput')
                .map(device => device.deviceId);
        }).catch(function(err) {
            console.log(err.name + ': ' + err.message);
        });


        this.setCamera();

        this.buttonNextCamera.onclick = this.nextCamera.bind(this);
    }

    async setCamera(cameraId?: string) {
        if (cameraId && cameraId === this.cameraId) return;

        const stream = await navigator.mediaDevices.getUserMedia({
            ...defaultCapabilities,
            video: {
                ...(<MediaTrackConstraints>defaultCapabilities.video),
                deviceId: cameraId,
            },
        });
        this.video.srcObject = stream;
        this.cameraId = cameraId;
    }

    imageData() {
        this.captureCounter += 1;
        this.captureContext.drawImage(
            this.video, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
        return {image_id: this.captureCounter, image: this.captureCanvas.toDataURL()};
    }

    nextCamera() {
        let nextCameraId = undefined;
        if (this.cameraId && this.cameraIds.length > 1) {
            const currentCameraIndex = this.cameraIds.indexOf(this.cameraId);
            let nextCameraIndex = currentCameraIndex + 1;
            if (nextCameraIndex >= this.cameraIds.length) nextCameraIndex = 0;
            nextCameraId = this.cameraIds[nextCameraIndex];
        } else if (this.cameraIds.length > 1) {
            // assume the default (unset this.cameraId) was camera 0, so go to 1
            nextCameraId = this.cameraIds[1];
        } else {
            nextCameraId = this.cameraIds[0];
        }
        this.setCamera(nextCameraId);
    }
}
