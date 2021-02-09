import asyncio
from collections import defaultdict
import logging

LOG = logging.getLogger(__name__)


class Signal:
    subscribers = defaultdict(list)

    @classmethod
    def emit(cls, name, *args, **kwargs):
        subscribers = cls.subscribers.get(name, [])
        LOG.debug('emit %s to %d subscribers', name, len(subscribers))
        for subscriber in subscribers:
            subscriber(*args, **kwargs)

    @classmethod
    def subscribe_callback(cls, name, subscriber):
        LOG.debug('subscribe a callback to %s', name)
        cls.subscribers[name].append(subscriber)

    @classmethod
    async def subscribe(cls, name):
        LOG.debug('subscribe to %s', name)
        q = asyncio.Queue()

        def callback(callback_output):
            q.put_nowait(callback_output)

        cls.subscribe_callback(name, callback)

        while True:
            queue_output = await q.get()
            yield queue_output
