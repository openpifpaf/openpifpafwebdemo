import json
import logging

import tornado.web

from . import key

LOG = logging.getLogger(__name__)


class HumanPoses(tornado.web.RequestHandler):
    demo_password = ''

    def set_default_headers(self):
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Allow-Headers',
                        'Content-Type, Access-Control-Allow-Headers')

    async def post(self):  # pylint: disable=arguments-differ
        self.set_default_headers()

        image = self.request.body

        resize = True
        if self.demo_password:
            if self.get_argument('pw', None) != self.demo_password:
                await self.finish(json.dumps({'error': 'demo in progress'}))
                return
            resize = False

        channel_id = self.get_argument('channel', str(key.generate(6)))
        if not key.validate(channel_id):
            return

        out_data = self.application.processor.single_image(image, resize=resize)
        out_data['channel'] = channel_id
        await self.finish(json.dumps(out_data))

        channel_name = 'channel:{}'.format(channel_id)
        LOG.info('publishing to %s', channel_name)
        self.application.signal.emit(channel_name, out_data)

    def options(self):
        self.set_default_headers()
        self.set_status(204)
        self.finish()
