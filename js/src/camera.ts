const defaultCapabilities: MediaStreamConstraints = { audio: false, video: { width: 640, height: 480 } };


export class Camera {
    ui: HTMLElement;
    video: HTMLVideoElement;
    captureCanvas: HTMLCanvasElement;
    originalCaptureCanvasSize: number[];
    captureContext: CanvasRenderingContext2D;
    buttonNextCamera: HTMLButtonElement;
    buttonScreenCapture: HTMLButtonElement;
    currentCamera?: string;
    captureCounter: number;
    modes: string[];
    mode: string;
    cameraId?: string;

    constructor(ui: HTMLElement) {
        this.ui = ui;
        this.video = ui.getElementsByTagName('video')[0];
        this.captureCanvas = ui.getElementsByTagName('canvas')[0];
        this.originalCaptureCanvasSize = [this.captureCanvas.width,
                                          this.captureCanvas.height];
        this.captureContext = this.captureCanvas.getContext('2d');
        this.buttonNextCamera = <HTMLButtonElement>ui.getElementsByClassName('nextCamera')[0];
        this.buttonScreenCapture = <HTMLButtonElement>ui.getElementsByClassName('screenCapture')[0];
        this.captureCounter = 0;

        this.modes = ['user', 'environment', 'screen'];
        this.mode = null;
        this.setCamera('user');

        this.buttonNextCamera.onclick = this.nextCamera.bind(this);
        this.buttonScreenCapture.onclick = this.screenCapture.bind(this);
    }

    async setCamera(mode: string) {
        if (mode === this.mode) return;
        this.mode = mode;

        let stream = null;
        if (['user', 'environment'].includes(this.mode)) {
            let capabilities = {
                ...defaultCapabilities,
                video: {
                    ...(<MediaTrackConstraints>defaultCapabilities.video),
                    facingMode: this.mode,
                },
                audio: false,
            };

            stream = await navigator.mediaDevices.getUserMedia(capabilities);
        } else {
            let capabilities = {
                ...defaultCapabilities,
                video: {
                    ...(<MediaTrackConstraints>defaultCapabilities.video),
                    cursor: 'never',
                    logicalSurface: true,
                    width: this.captureCanvas.width,
                },
                audio: false,
            };

            stream = await navigator.mediaDevices.getDisplayMedia(capabilities);
        }
        this.video.srcObject = stream;
    }

    async imageData() {
        // update capture canvas size
        const landscape = this.video.clientWidth > this.video.clientHeight;
        const targetSize = landscape ? this.originalCaptureCanvasSize : this.originalCaptureCanvasSize.slice().reverse();
        if (this.captureCanvas.width !== targetSize[0]) this.captureCanvas.width = targetSize[0];
        if (this.captureCanvas.height !== targetSize[1]) this.captureCanvas.height = targetSize[1];

        // capture
        this.captureCounter += 1;

        // draw
        this.captureContext.save();
        if (this.mode === 'user') {
            this.captureContext.translate(this.captureCanvas.width, 0);
            this.captureContext.scale(-1, 1);
        }
        this.captureContext.drawImage(
            this.video, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
        this.captureContext.restore();

        let image = null;
        await new Promise<void>(resolve => this.captureCanvas.toBlob(blob => {
            image = blob;
            resolve();
        }));

        return {imageId: this.captureCounter, image: image};
    }

    nextCamera() {
        const facingMode = this.mode === 'environment' ? 'user' : 'environment';
        this.setCamera(facingMode);
    }

    screenCapture() {
        this.setCamera('screen');
    }
}
