import json
import logging
import socket

import tornado.web

from .. import __version__
from . import key

LOG = logging.getLogger(__name__)


class Feed(tornado.web.RequestHandler):
    async def _event(self, name, data):
        self.write('event: {}\n'.format(name))
        self.write('data: {}\n\n'.format(data))
        await self.flush()

    async def get(self):
        self.set_header('content-type', 'text/event-stream')
        self.set_header('cache-control', 'no-cache')
        self.set_header('Access-Control-Allow-Origin', '*')
        self.set_header('Access-Control-Expose-Headers', '*')
        self.set_header('Access-Control-Allow-Credentials', 'true')

        await self._event('info', json.dumps({
            'frontend_version': __version__,
            'frontend_host': socket.gethostname(),
        }))

        channel_id = self.get_argument('channel', None)
        if not key.validate(channel_id):
            await self._event('error', 'no channel provided')
            return
        await self._event('channel', channel_id)

        channel_name = 'channel:{}'.format(channel_id)
        LOG.info('subscribing to %s', channel_name)
        async for json_data in self.application.signal.subscribe(channel_name):
            try:
                await self._event('pose_data', json_data)
            except tornado.iostream.StreamClosedError:
                return
