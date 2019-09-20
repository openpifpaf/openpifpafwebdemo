const defaultCapabilities: MediaStreamConstraints = { audio: false, video: { width: 640, height: 480 } };


export class Camera {
    ui: HTMLElement;
    video: HTMLVideoElement;
    captureCanvas: HTMLCanvasElement;
    originalCaptureCanvasSize: number[];
    captureContext: CanvasRenderingContext2D;
    buttonNextCamera: HTMLButtonElement;
    currentCamera?: string;
    captureCounter: number;
    facingMode: string;
    cameraId?: string;

    constructor(ui: HTMLElement) {
        this.ui = ui;
        this.video = ui.getElementsByTagName('video')[0];
        this.captureCanvas = ui.getElementsByTagName('canvas')[0];
        this.originalCaptureCanvasSize = [this.captureCanvas.width,
                                          this.captureCanvas.height];
        this.captureContext = this.captureCanvas.getContext('2d');
        this.buttonNextCamera = <HTMLButtonElement>ui.getElementsByClassName('nextCamera')[0];
        this.captureCounter = 0;

        this.facingMode = null;
        this.setCamera('user');

        this.buttonNextCamera.onclick = this.nextCamera.bind(this);
    }

    async setCamera(facingMode: string) {
        if (facingMode === this.facingMode) return;
        this.facingMode = facingMode;

        let capabilities = {
            ...defaultCapabilities,
            video: {
                ...(<MediaTrackConstraints>defaultCapabilities.video),
                facingMode: this.facingMode,
            }
        };

        const stream = await navigator.mediaDevices.getUserMedia(capabilities);
        this.video.srcObject = stream;
    }

    imageData() {
        // update capture canvas size
        const landscape = this.video.clientWidth > this.video.clientHeight;
        const targetSize = landscape ? this.originalCaptureCanvasSize : this.originalCaptureCanvasSize.slice().reverse();
        if (this.captureCanvas.width !== targetSize[0]) this.captureCanvas.width = targetSize[0];
        if (this.captureCanvas.height !== targetSize[1]) this.captureCanvas.height = targetSize[1];

        // capture
        this.captureCounter += 1;

        // draw
        this.captureContext.save();
        if (this.facingMode == 'user') {
            this.captureContext.translate(this.captureCanvas.width, 0);
            this.captureContext.scale(-1, 1);
        }
        this.captureContext.drawImage(
            this.video, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
        this.captureContext.restore();

        return {image_id: this.captureCounter, image: this.captureCanvas.toDataURL()};
    }

    nextCamera() {
        const facingMode = this.facingMode === 'user' ? 'environment' : 'user';
        this.setCamera(facingMode);
    }
}
