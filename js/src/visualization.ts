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

    draw(image, data) {
        const scores = data.map((entry: any) => entry.score);

        // adjust height of output canvas
        if (data && data.length > 0) {
            const landscape = data[0].width_height[0] > data[0].width_height[1];
            const targetSize = landscape ? this.originalCanvasSize : this.originalCanvasSize.slice().reverse();
            if (this.canvas.width !== targetSize[0]) this.canvas.width = targetSize[0];
            if (this.canvas.height !== targetSize[1]) this.canvas.height = targetSize[1];
        }

        // draw on output canvas
        let i = new Image();
        i.onload = () => {
            this.context.drawImage(i, 0, 0, this.canvas.width, this.canvas.height);
            data.forEach((entry: any) => this.drawSkeleton(entry.coordinates, entry.detection_id));
        };
        i.src = image;
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

    drawSkeleton(keypoints, detection_id) {
        this.drawSkeletonLines(keypoints);

        keypoints.forEach((xyv, joint_id) => {
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
}
