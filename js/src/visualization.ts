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


export class Visualization {
    ui: HTMLElement;
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
    originalCanvasSize: number[];
    lineWidth: number;
    markerSize: number;

    constructor(ui: HTMLElement) {
        this.canvas = <HTMLCanvasElement>ui.getElementsByTagName('canvas')[0];
        this.originalCanvasSize = [this.canvas.width, this.canvas.height];
        this.context = this.canvas.getContext('2d');

        this.lineWidth = 10;
        this.markerSize = 4;
    }

    draw(image: Blob, data) {
        if (data === null) return;
        console.log(data);
        const annotations = data.annotations;

        // adjust height of output canvas
        if (data && data.length > 0) {
            const width_height = data.annotations[0].width_height;
            const landscape = width_height[0] > width_height[1];
            const targetSize = landscape ? this.originalCanvasSize : this.originalCanvasSize.slice().reverse();
            if (this.canvas.width !== targetSize[0]) this.canvas.width = targetSize[0];
            if (this.canvas.height !== targetSize[1]) this.canvas.height = targetSize[1];
        }

        // draw on output canvas
        const canvasImage = new Image();
        return new Promise<void>((resolve, reject) => {
            canvasImage.onload = () => {
                this.context.drawImage(canvasImage, 0, 0, this.canvas.width, this.canvas.height);
                annotations.forEach((annotation: any) => this.drawSkeleton(annotation));
                resolve();
            };
            canvasImage.onerror = () => reject();
            // canvasImage.src = image;
            canvasImage.src = URL.createObjectURL(image);
        });
    }

    drawSkeletonLines(keypoints) {
        COCO_PERSON_SKELETON.forEach((joint_pair, connection_index) => {
            const [joint1i, joint2i] = joint_pair;
            const joint1xyv = keypoints[joint1i - 1];
            const joint2xyv = keypoints[joint2i - 1];
            const color = COLORS[connection_index % COLORS.length];
            this.context.strokeStyle = color;
            this.context.lineWidth = this.lineWidth;
            if (joint1xyv[2] === 0.0 || joint2xyv[2] === 0.0) return;

            this.context.beginPath();
            this.context.moveTo(joint1xyv[0] * this.canvas.width, joint1xyv[1] * this.canvas.height);
            this.context.lineTo(joint2xyv[0] * this.canvas.width, joint2xyv[1] * this.canvas.height);
            this.context.stroke();
        });
    }

    drawSkeleton(annotation) {
        this.drawSkeletonLines(annotation.keypoints);

        annotation.keypoints.forEach((xyv, joint_id) => {
            if (xyv[2] === 0.0) return;

            this.context.beginPath();
            this.context.fillStyle = '#ffffff';
            this.context.arc(xyv[0] * this.canvas.width,
                             xyv[1] * this.canvas.height,
                             this.markerSize,
                             0, 2 * Math.PI);
            this.context.fill();
        });
    }

    drawFields(image: string, pifC, pifR, pafC, pafR1, pafR2, threshold: number) {
        // adjust height of output canvas
        const landscape = pifC.dims[3] > pifC.dims[2];
        const targetSize = landscape ? this.originalCanvasSize : this.originalCanvasSize.slice().reverse();
        if (this.canvas.width !== targetSize[0]) this.canvas.width = targetSize[0];
        if (this.canvas.height !== targetSize[1]) this.canvas.height = targetSize[1];

        // draw on output canvas
        const canvasImage = new Image();
        return new Promise<void>((resolve, reject) => {
            canvasImage.onload = () => {
                this.context.drawImage(canvasImage, 0, 0, this.canvas.width, this.canvas.height);

                const xScale = this.canvas.width / (pifC.dims[3] - 1);
                const yScale = this.canvas.height / (pifC.dims[2] - 1);

                let pafCounter = 0;
                for (let ii = 0; ii < pafC.dims[2]; ++ii) {
                    for (let jj = 0; jj < pafC.dims[3]; ++jj) {
                        for (let kk = 0; kk < pafC.dims[1]; ++kk) {
                            const v = <number>pafC.get(0, kk, ii, jj);
                            if (v < threshold) continue;
                            pafCounter += 1;

                            const fx1 = jj + <number>pafR1.get(0, kk, 0, ii, jj);
                            const fy1 = ii + <number>pafR1.get(0, kk, 1, ii, jj);
                            const fx2 = jj + <number>pafR2.get(0, kk, 0, ii, jj);
                            const fy2 = ii + <number>pafR2.get(0, kk, 1, ii, jj);

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
                            const v = <number>pifC.get(0, ll, ii, jj);
                            if (v < threshold) continue;
                            pifCounter += 1;

                            this.context.beginPath();
                            this.context.fillStyle = '#fff';
                            const fx = jj + <number>pifR.get(0, ll, 0, ii, jj);
                            const fy = ii + <number>pifR.get(0, ll, 1, ii, jj);
                            this.context.arc(fx * xScale, fy * yScale,
                                            (v - threshold) / threshold * this.markerSize,
                                            0, 2 * Math.PI);
                            this.context.fill();
                        }
                    }
                }
                console.log({pifCounter, pafCounter});

                resolve();
            };
            canvasImage.onerror = () => reject();
            canvasImage.src = image;
        });
    }
}
