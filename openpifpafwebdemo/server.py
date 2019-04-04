from __future__ import division

import argparse
import base64
import io
import json
import re
import time

import PIL
import torch
import tornado
from tornado.web import RequestHandler

import databench
import openpifpaf
import openpifpaf.network.nets
import openpifpaf.transforms

from . import __version__ as VERSION


class Processor(object):
    def __init__(self, args):
        # load model
        self.model, _ = openpifpaf.network.nets.factory_from_args(args)
        self.model = self.model.to(args.device)
        self.processor = openpifpaf.decoder.factory_from_args(args, self.model)
        self.device = args.device
        self.resolution = args.resolution

    def single_image(self, b64image):
        imgstr = re.search(r'base64,(.*)', b64image).group(1)
        image_bytes = io.BytesIO(base64.b64decode(imgstr))
        im = PIL.Image.open(image_bytes).convert('RGB')
        print('input image', im.size, self.resolution)

        landscape = im.size[0] > im.size[1]
        if landscape:
            im = im.resize(
                (int(640 * self.resolution), int(480 * self.resolution)),
                PIL.Image.BICUBIC,
            )
        else:
            im = im.resize(
                (int(480 * self.resolution), int(640 * self.resolution)),
                PIL.Image.BICUBIC,
            )
        width_height = im.size

        start = time.time()
        preprocess = openpifpaf.transforms.image_transform
        processed_image_cpu = preprocess(im)
        processed_image = processed_image_cpu.contiguous().to(self.device, non_blocking=True)
        print('preprocessing time', time.time() - start)

        all_fields = self.processor.fields(torch.unsqueeze(processed_image.float(), 0))[0]
        keypoint_sets, scores = self.processor.keypoint_sets(all_fields)

        # normalize scale
        keypoint_sets[:, :, 0] /= processed_image_cpu.shape[2]
        keypoint_sets[:, :, 1] /= processed_image_cpu.shape[1]

        return keypoint_sets, scores, width_height


PROCESSOR_SINGLETON = None


class Demo(databench.Analysis):
    pass


# pylint: disable=abstract-method
class PostHandler(RequestHandler):
    def set_default_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Headers',
                        'Content-Type, Access-Control-Allow-Headers')

    def post(self):  # pylint: disable=arguments-differ
        self.set_default_headers()

        image = self.get_argument('image', None)
        if image is None:
            image = json.loads(self.request.body).get('image', None)
        if image is None:
            self.write('no image provided')
            return

        keypoint_sets, scores, width_height = PROCESSOR_SINGLETON.single_image(image)
        keypoint_sets = [{
            'coordinates': keypoints.tolist(),
            'detection_id': i,
            'score': score,
            'width_height': width_height,
        } for i, (keypoints, score) in enumerate(zip(keypoint_sets, scores))]
        self.write(json.dumps(keypoint_sets))

    def options(self):
        self.set_default_headers()
        self.set_status(204)
        self.finish()


async def grep_static(url='http://127.0.0.1:5000', dest='openpifpafwebdemo/static/index.html'):
    http_client = tornado.httpclient.AsyncHTTPClient()
    response = await http_client.fetch(url)
    out = response.body.decode()
    out = out.replace('="/_static', '="_static')
    out = out.replace('href="/"', 'href="/openpifpafwebdemo"')
    with open(dest, 'w') as f:
        f.write(out)
    http_client.close()


def main():
    global PROCESSOR_SINGLETON  # pylint: disable=global-statement

    parser = argparse.ArgumentParser()
    openpifpaf.decoder.cli(parser, force_complete_pose=False, instance_threshold=0.05)
    openpifpaf.network.nets.cli(parser)
    parser.add_argument('--disable-cuda', action='store_true',
                        help='disable CUDA')
    parser.add_argument('--resolution', default=0.3, type=float)
    parser.add_argument('--grep-static', default=False, action='store_true')
    parser.add_argument('--google-analytics')
    args = parser.parse_args()

    # add args.device
    args.device = torch.device('cpu')
    if not args.disable_cuda and torch.cuda.is_available():
        args.device = torch.device('cuda')

    PROCESSOR_SINGLETON = Processor(args)

    if args.grep_static:
        tornado.ioloop.IOLoop.current().call_later(1.0, grep_static)

    tornado.autoreload.watch('openpifpafwebdemo/index.html')
    tornado.autoreload.watch('openpifpafwebdemo/analysis.js')

    databench.run(Demo, __file__,
                  info={'title': 'OpenPifPafWebDemo',
                        'google_analytics': args.google_analytics,
                        'version': VERSION},
                  static={r'(analysis\.js.*)': '.', r'static/(.*)': 'openpifpafwebdemo/static'},
                  extra_routes=[('process', PostHandler, None)])


if __name__ == '__main__':
    main()
