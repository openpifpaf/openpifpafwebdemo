from __future__ import division

import argparse
import base64
import io
import re
import time

import numpy as np
import PIL
import torch

import databench
import openpifpaf
import openpifpaf.network.nets
import openpifpaf.transforms


parser = argparse.ArgumentParser()
openpifpaf.decoder.cli(parser, force_complete_pose=False)
openpifpaf.network.nets.cli(parser)
parser.add_argument('--disable-cuda', action='store_true',
                    help='disable CUDA')
parser.add_argument('--figure-width', default=10.0, type=float,
                    help='figure width')
args = parser.parse_args()

args.device = torch.device('cpu')

# load model
model, _ = openpifpaf.network.nets.factory(args)
#model = model.to(args.device)
processors = openpifpaf.decoder.factory(args, model)


class Demo(databench.Analysis):
    @databench.on
    def connected(self):
        yield self.data.init({'resolution': 0.2, 'fps': 0, 'last_frame': 0})

    @databench.on
    def image(self, image_id, image):
        imgstr = re.search(r'base64,(.*)', image).group(1)
        image_bytes = io.BytesIO(base64.b64decode(imgstr))
        im = PIL.Image.open(image_bytes).convert('RGB')
        print(self.data['resolution'])
        im = im.resize(
            (int(640 * self.data['resolution']),
             int(320 * self.data['resolution'])),
            PIL.Image.BICUBIC,
        )

        start = time.time()
        preprocess = openpifpaf.transforms.image_transform
        processed_image_cpu = preprocess(im)
        processed_image = processed_image_cpu.contiguous().to(args.device, non_blocking=True)
        print('preprocessing time', time.time() - start)

        all_fields = processors[0].fields(torch.unsqueeze(processed_image.float(), 0))[0]
        for processor in processors:
            keypoint_sets, scores = processor.keypoint_sets(all_fields)

            # normalize scale
            keypoint_sets[:, :, 0] /= processed_image_cpu.shape[2]
            keypoint_sets[:, :, 1] /= processed_image_cpu.shape[1]

            self.emit('keypoints', {
                'keypoint_sets': [{
                    'keypoints': np.around(kps, 4).tolist(),
                    'detection_id': i,
                }  for i, kps in enumerate(keypoint_sets)],
                'image_id': image_id,
            })

        # yield self.emit('log', {'action': 'done'})
        yield self.emit('idle')

        new_fps = 0.5 * self.data['fps'] + 0.5 * (1.0 / (time.time() - self.data['last_frame']))
        yield self.data.set_state(fps=new_fps, last_frame=time.time())

    @databench.on
    def resolution(self, value):
        print(value)
        yield self.set_state(resolution=value)


if __name__ == '__main__':
    databench.run(Demo, __file__,
                  info={'title': 'OpenPifPaf Demo'},
                  static={r'(analysis\.js)': '.'})
