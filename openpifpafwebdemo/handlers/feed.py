import json
import logging
import socket

import tornado.web

from .. import __version__
from . import key

LOG = logging.getLogger(__name__)


# pylint: disable=abstract-method
class Feed(tornado.web.RequestHandler):
    async def get(self):
        self.set_header('content-type', 'text/event-stream')
        self.set_header('cache-control', 'no-cache')
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Expose-Headers', '*')
        self.set_header('Access-Control-Allow-Credentials', 'true')

        self.write('event: info\n')
        self.write('data: {}\n\n'.format(json.dumps({
            'frontend_version': __version__,
            'frontend_host': socket.gethostname(),
        })))
        await self.flush()

        channel_id = self.get_argument('id', str(key.generate(6)))
        if not key.validate(channel_id):
            return
        self.write('event: id\n')
        self.write('data: {}\n\n'.format(channel_id))
        await self.flush()

        channel_name = 'location_update:{}'.format(channel_id)
        LOG.info('subscribing to %s', channel_name)
        async for json_data in self.application.redis_sub.subscribe(channel_name):
            try:
                self.write('event: pose_data\n')
                self.write('data: {}\n\n'.format(json_data))
                await self.flush()
            except tornado.iostream.StreamClosedError:
                return
