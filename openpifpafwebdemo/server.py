"""OpenPifPaf web demo server process."""

import argparse
import json
import logging
import os
import random
import shutil
import ssl
import string
import sys

import torch
import tornado
import tornado.autoreload
import tornado.httpclient
from tornado.web import RequestHandler

import openpifpaf

from .processor import Processor
from . import __version__ as VERSION


# pylint: disable=abstract-method
class PostHandler(RequestHandler):
    def initialize(self, processor, *, demo_password):
        self.processor = processor  # pylint: disable=attribute-defined-outside-init
        self.demo_password = demo_password  # pylint: disable=attribute-defined-outside-init

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

        resize = True
        if self.demo_password:
            if self.get_argument('pw', None) != self.demo_password:
                self.write(json.dumps({'error': 'demo in progress'}))
                return
            resize = False
        keypoint_sets, scores, width_height = self.processor.single_image(image, resize=resize)
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


class RenderTemplate(tornado.web.RequestHandler):
    def initialize(self, template_name, **info):
        self.template_name = template_name  # pylint: disable=attribute-defined-outside-init
        self.info = info  # pylint: disable=attribute-defined-outside-init

    def get(self):
        self.render(self.template_name, **self.info)

    def head(self):
        pass


class Index(tornado.web.RequestHandler):
    def initialize(self, template_name, demo_password, **info):
        self.template_name = template_name  # pylint: disable=attribute-defined-outside-init
        self.demo_password = demo_password  # pylint: disable=attribute-defined-outside-init
        self.info = info  # pylint: disable=attribute-defined-outside-init

    def get(self):
        password = self.get_argument('pw', default=None)
        if self.demo_password and password == self.demo_password:
            self.info['width_height'] = (801, 601)
        elif self.demo_password:
            self.write('Demo currently in progress. Check back later.')
            return
        self.render(self.template_name, **self.info)

    def head(self):
        pass


async def grep_static(dest, url='http://127.0.0.1:5000'):
    http_client = tornado.httpclient.AsyncHTTPClient()
    response = await http_client.fetch(url)
    out = response.body.decode()
    with open(dest, 'w') as f:
        f.write(out)
    http_client.close()


def cli():
    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    openpifpaf.decoder.cli(parser, force_complete_pose=False,
                           instance_threshold=0.1, seed_threshold=0.5)
    openpifpaf.network.cli(parser)

    parser.add_argument('--disable-cuda', action='store_true',
                        help='disable CUDA')
    parser.add_argument('--resolution', default=0.4, type=float,
                        help=('Resolution prescale factor from 640x480. '
                              'Will be rounded to multiples of 16.'))
    parser.add_argument('--write-static-page', default=None,
                        help='directory in which to create a static version of this page')
    parser.add_argument('--demo-password', default=None,
                        help='password that allows better performance for a demo')
    parser.add_argument('--debug', default=False, action='store_true',
                        help='debug messages and autoreload')
    parser.add_argument('--google-analytics',
                        help='provide a google analytics id to inject analytics code')

    parser.add_argument('--host', dest='host',
                        default=os.environ.get('HOST', '127.0.0.1'),
                        help='host address for webserver, use 0.0.0.0 for global access')
    parser.add_argument('--port', dest='port',
                        type=int, default=int(os.environ.get('PORT', 5000)),
                        help='port for webserver')

    ssl_args = parser.add_argument_group('SSL')
    ssl_args.add_argument('--ssl-certfile', dest='ssl_certfile',
                          default=os.environ.get('SSLCERTFILE'),
                          help='SSL certificate file')
    ssl_args.add_argument('--ssl-keyfile', dest='ssl_keyfile',
                          default=os.environ.get('SSLKEYFILE'),
                          help='SSL key file')
    ssl_args.add_argument('--ssl-port', dest='ssl_port', type=int,
                          default=int(os.environ.get('SSLPORT', 0)),
                          help='SSL port for webserver')

    args = parser.parse_args()

    # log
    logging.basicConfig(level=logging.INFO if not args.debug else logging.DEBUG)

    # configure
    openpifpaf.network.configure(args)

    # config
    logging.debug('host=%s, port=%d', args.host, args.port)
    logging.debug('Python %s, OpenPifPafWebDemo %s', sys.version, VERSION)
    if args.host in ('localhost', '127.0.0.1'):
        logging.info('Open http://%s:%d in a web browser.', args.host, args.port)

    # add args.device
    args.device = torch.device('cpu')
    if not args.disable_cuda and torch.cuda.is_available():
        args.device = torch.device('cuda')

    return args


def main():
    args = cli()
    width_height = (int(640 * args.resolution // 16) * 16 + 1,
                    int(480 * args.resolution // 16) * 16 + 1)
    logging.debug('target width and height = %s', width_height)
    processor_singleton = Processor(width_height, args)

    static_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')

    if args.write_static_page:
        shutil.copytree(static_path, os.path.join(args.write_static_page, 'static'))
        tornado.ioloop.IOLoop.current().call_later(
            1.0, grep_static, os.path.join(args.write_static_page, 'index.html'))

    tornado.autoreload.watch('openpifpafwebdemo/index.html')
    tornado.autoreload.watch('openpifpafwebdemo/static/frontend.js')
    tornado.autoreload.watch('openpifpafwebdemo/static/clientside.js')

    if args.debug:
        version = '{}-{}'.format(
            VERSION,
            ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        )
    else:
        version = VERSION

    app = tornado.web.Application(
        [
            (r'/', Index, {
                'template_name': 'index.html',
                'demo_password': args.demo_password,

                # HTML template parameters
                'title': 'OpenPifPafWebDemo',
                'description': 'Interactive web browser based demo of OpenPifPaf.',
                'version': version,
                'google_analytics': args.google_analytics,
                'width_height': width_height,
            }),
            (r'/client.html', RenderTemplate, {
                'template_name': 'client.html',
                'title': 'OpenPifPafWebDemo Serverless',
                'description': 'Interactive web browser based demo of OpenPifPaf.',
                'version': version,
                'google_analytics': args.google_analytics,
                'width_height': width_height,
                'models': [
                    {'displayname': 'ResNet18 (44MB)', 'shortname': 'resnet18',
                     'url': 'static/openpifpaf-resnet18.onnx'},
                    {'displayname': 'ResNet50 (97MB)', 'shortname': 'resnet50',
                     'url': 'static/openpifpaf-resnet50.onnx'},
                ],
            }),
            (r'/(favicon\.ico)', tornado.web.StaticFileHandler, {
                'path': os.path.join(static_path, 'favicon.ico'),
            }),
            (r'/process', PostHandler, {
                'processor': processor_singleton,
                'demo_password': args.demo_password,
            }),
        ],
        debug=args.debug,
        static_path=static_path,
    )
    app.listen(args.port, args.host)

    # HTTPS server
    if args.ssl_port:
        if args.ssl_certfile and args.ssl_keyfile:
            ssl_ctx = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
            ssl_ctx.load_cert_chain(args.ssl_certfile, args.ssl_keyfile)
        else:
            # use Tornado's self signed certificates
            module_dir = os.path.dirname(tornado.__file__)
            ssl_ctx = {
                'certfile': os.path.join(module_dir, 'test', 'test.crt'),
                'keyfile': os.path.join(module_dir, 'test', 'test.key'),
            }

        logging.info('Open https://%s:%d in a web browser.', args.host, args.ssl_port)
        app.listen(args.ssl_port, ssl_options=ssl_ctx)

    try:
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.current().stop()


if __name__ == '__main__':
    main()
