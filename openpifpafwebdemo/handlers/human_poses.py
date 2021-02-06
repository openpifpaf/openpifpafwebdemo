import json
import logging

import tornado.web

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
        keypoint_sets, scores, width_height = \
            self.application.processor.single_image(image, resize=resize)
        keypoint_sets = [{
            'coordinates': keypoints.tolist(),
            'detection_id': i,
            'score': score,
            'width_height': width_height,
        } for i, (keypoints, score) in enumerate(zip(keypoint_sets, scores))]
        await self.finish(json.dumps(keypoint_sets))

    def options(self):
        self.set_default_headers()
        self.set_status(204)
        self.finish()
