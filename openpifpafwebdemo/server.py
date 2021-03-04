"""OpenPifPaf web demo server process."""

import argparse
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

import openpifpaf

from .processor import Processor
from . import __version__
from . import handlers
from .signal import Signal

LOG = logging.getLogger(__name__)


async def grep_static(dest, url='http://127.0.0.1:5000'):
    http_client = tornado.httpclient.AsyncHTTPClient()
    response = await http_client.fetch(url)
    out = response.body.decode()
    with open(dest, 'w') as f:
        f.write(out)
    http_client.close()


def cli():
    openpifpaf.plugin.register()

    parser = argparse.ArgumentParser(
        description=__doc__,
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )

    openpifpaf.decoder.cli(parser)
    openpifpaf.logger.cli(parser)
    openpifpaf.network.Factory.cli(parser)

    parser.add_argument('--disable-cuda', action='store_true',
                        help='disable CUDA')
    parser.add_argument('--resolution', default=0.4, type=float,
                        help=('Resolution prescale factor from 640x480. '
                              'Will be rounded to multiples of 16.'))
    parser.add_argument('--write-static-page', default=None,
                        help='directory in which to create a static version of this page')
    parser.add_argument('--demo-password', default=None,
                        help='password that allows better performance for a demo')
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

    # configure
    openpifpaf.logger.configure(args, LOG)
    openpifpaf.network.Factory.configure(args)

    # config
    LOG.debug('host=%s, port=%d', args.host, args.port)
    LOG.debug('Python %s, OpenPifPafWebDemo %s', sys.version, __version__)
    if args.host in ('localhost', '127.0.0.1'):
        LOG.info('Open http://%s:%d in a web browser.', args.host, args.port)
    if args.host != '0.0.0.0':
        LOG.info('Access is restricted by IP address. Use --host=0.0.0.0 to allow all.')

    # add args.device
    args.device = torch.device('cpu')
    if not args.disable_cuda and torch.cuda.is_available():
        args.device = torch.device('cuda')

    return args


class Application(tornado.web.Application):
    def __init__(self, handler_list, *, processor, signal, **settings):
        self.processor = processor
        self.signal = signal
        super().__init__(handler_list, **settings)


def main():
    args = cli()
    width_height = (int(640 * args.resolution // 16) * 16 + 1,
                    int(480 * args.resolution // 16) * 16 + 1)
    LOG.debug('target width and height = %s', width_height)
    processor_singleton = Processor(width_height, args)

    static_path = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'static')

    if args.write_static_page:
        shutil.copytree(static_path, os.path.join(args.write_static_page, 'static'))
        tornado.ioloop.IOLoop.current().call_later(
            1.0, grep_static, os.path.join(args.write_static_page, 'index.html'))

    tornado.autoreload.watch('openpifpafwebdemo/index.html')
    tornado.autoreload.watch('openpifpafwebdemo/static/frontend.js')
    tornado.autoreload.watch('openpifpafwebdemo/static/clientside.js')

    if LOG.getEffectiveLevel() == logging.DEBUG:
        version = '{}-{}'.format(
            __version__,
            ''.join(random.choices(string.ascii_lowercase + string.digits, k=4))
        )
    else:
        version = __version__

    app = Application(
        [
            (r'/', handlers.Index, {
                'template_name': 'index.html',
                'demo_password': args.demo_password,

                # HTML template parameters
                'title': 'OpenPifPafWebDemo',
                'description': 'Interactive web browser based demo of OpenPifPaf.',
                'version': version,
                'google_analytics': args.google_analytics,
                'width_height': width_height,
            }),
            (r'/client.html', handlers.RenderTemplate, {
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
            (r'/v1/feed', handlers.Feed),
            (r'/v1/human-poses', handlers.HumanPoses),
        ],
        debug=args.debug,
        processor=processor_singleton,
        signal=Signal(),  # can also by Redis PubSub
        static_path=static_path,
        template_path=os.path.dirname(__file__),
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

        LOG.info('Open https://%s:%d in a web browser.', args.host, args.ssl_port)
        app.listen(args.ssl_port, ssl_options=ssl_ctx)

    try:
        tornado.ioloop.IOLoop.current().start()
    except KeyboardInterrupt:
        tornado.ioloop.IOLoop.current().stop()


if __name__ == '__main__':
    main()
