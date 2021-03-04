import io
import logging
import time

import PIL
import torch

import openpifpaf

LOG = logging.getLogger(__name__)


class Processor:
    def __init__(self, width_height, args):
        self.width_height = width_height

        # load model
        model_cpu, _ = openpifpaf.network.Factory().factory()
        self.model = model_cpu.to(args.device)
        head_metas = [hn.meta for hn in model_cpu.head_nets]
        self.processor = openpifpaf.decoder.factory(head_metas)
        self.device = args.device

    def single_image(self, image_bytes, *, resize=True):
        start = time.perf_counter()
        im = PIL.Image.open(io.BytesIO(image_bytes)).convert('RGB')

        if resize:
            target_wh = self.width_height
            if (im.size[0] > im.size[1]) != (target_wh[0] > target_wh[1]):
                target_wh = (target_wh[1], target_wh[0])
            if im.size[0] != target_wh[0] or im.size[1] != target_wh[1]:
                LOG.warning('have to resize image to %s from %s', target_wh, im.size)
                im = im.resize(target_wh, PIL.Image.BILINEAR)
        width_height = im.size

        preprocess = openpifpaf.transforms.EVAL_TRANSFORM
        processed_image = preprocess(im, [], None)[0]
        preprocessing_time = time.perf_counter() - start

        image_tensors_batch = torch.unsqueeze(processed_image.float(), 0)
        pred_anns = self.processor.batch(self.model, image_tensors_batch, device=self.device)[0]

        json_anns = [(ann
                      .rescale((1.0 / width_height[0], 1.0 / width_height[1]))
                      .json_data(coordinate_digits=5))
                     for ann in pred_anns]
        for d in json_anns:
            d['keypoints'] = list(zip(
                d['keypoints'][0::3],
                d['keypoints'][1::3],
                d['keypoints'][2::3],
            ))

        return {
            'annotations': json_anns,
            'width_height': width_height,
            'preprocessing_ms': round(preprocessing_time * 1000.0, 1),
        }
