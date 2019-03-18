from __future__ import division

import argparse
import base64
import io
import json
import re
import time

import numpy as np
import PIL
import torch
from tornado.web import RequestHandler

import databench
import openpifpaf
import openpifpaf.network.nets
import openpifpaf.transforms


class Processor(object):
    def __init__(self, args):
        # load model
        self.model, _ = openpifpaf.network.nets.factory(args)
        self.model = self.model.to(args.device)
        self.processors = openpifpaf.decoder.factory(args, self.model)
        self.device = args.device

    def single_image(self, b64image, resolution):
        imgstr = re.search(r'base64,(.*)', b64image).group(1)
        image_bytes = io.BytesIO(base64.b64decode(imgstr))
        im = PIL.Image.open(image_bytes).convert('RGB')
        print(resolution)
        im = im.resize(
            (int(640 * resolution), int(320 * resolution)),
            PIL.Image.BICUBIC,
        )

        start = time.time()
        preprocess = openpifpaf.transforms.image_transform
        processed_image_cpu = preprocess(im)
        processed_image = processed_image_cpu.contiguous().to(self.device, non_blocking=True)
        print('preprocessing time', time.time() - start)

        all_fields = self.processors[0].fields(torch.unsqueeze(processed_image.float(), 0))[0]
        for processor in self.processors:
            keypoint_sets, scores = processor.keypoint_sets(all_fields)

            # normalize scale
            keypoint_sets[:, :, 0] /= processed_image_cpu.shape[2]
            keypoint_sets[:, :, 1] /= processed_image_cpu.shape[1]

            yield keypoint_sets, scores


PROCESSOR_SINGLETON = None


class Demo(databench.Analysis):
    @databench.on
    def connected(self):
        yield self.data.init({'resolution': 0.2, 'fps': 0, 'last_frame': 0})

    @databench.on
    def image(self, image_id, image):
        # with open('test_image.txt', 'w') as f:
        #     f.write(image)
        results = PROCESSOR_SINGLETON.single_image(image, self.data['resolution'])
        yield self.emit('idle')

        for keypoint_sets, scores in results:
            self.emit('keypoints', {
                'keypoint_sets': [{
                    'keypoints': np.around(kps, 4).tolist(),
                    'detection_id': i,
                    'score': score,
                }  for i, (kps, score) in enumerate(zip(keypoint_sets, scores))],
                'image_id': image_id,
            })

        new_fps = 0.5 * self.data['fps'] + 0.5 * (1.0 / (time.time() - self.data['last_frame']))
        yield self.data.set_state(fps=new_fps, last_frame=time.time())

    @databench.on
    def resolution(self, value):
        print(value)
        yield self.set_state(resolution=value)


# pylint: disable=abstract-method
class PostHandler(RequestHandler):
    def post(self):  # pylint: disable=arguments-differ
        image = self.get_argument('image', None)
        if image is None:
            image = json.loads(self.request.body).get('image', None)
        if image is None:
            self.write('no image provided')
            return

        for keypoint_sets, scores in PROCESSOR_SINGLETON.single_image(image, 0.2):
            keypoint_sets = [{
                'coordinates': keypoints.tolist(),
                'score': score,
            } for keypoints, score in zip(keypoint_sets, scores)]
            self.write(json.dumps(keypoint_sets))


def main():
    global PROCESSOR_SINGLETON  # pylint: disable=global-statement

    parser = argparse.ArgumentParser()
    openpifpaf.decoder.cli(parser, force_complete_pose=False)
    openpifpaf.network.nets.cli(parser)
    parser.add_argument('--disable-cuda', action='store_true',
                        help='disable CUDA')
    parser.add_argument('--figure-width', default=10.0, type=float,
                        help='figure width')
    args = parser.parse_args()
    args.device = torch.device('cpu')
    PROCESSOR_SINGLETON = Processor(args)

    databench.run(Demo, __file__,
                  info={'title': 'OpenPifPaf Demo'},
                  static={r'(analysis\.js)': '.'},
                  extra_routes=[('process', PostHandler, None)])


if __name__ == '__main__':
    main()
