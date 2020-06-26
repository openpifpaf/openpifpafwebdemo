import base64
import io
import time
import re

import PIL
import torch

import openpifpaf


class Processor(object):
    def __init__(self, width_height, args):
        self.width_height = width_height

        # load model
        self.model, _ = openpifpaf.network.factory_from_args(args)
        self.model = self.model.to(args.device)
        self.processor = openpifpaf.decoder.factory_from_args(args, self.model)
        self.device = args.device

    def single_image(self, b64image, *, resize=True):
        imgstr = re.search(r'base64,(.*)', b64image).group(1)
        image_bytes = io.BytesIO(base64.b64decode(imgstr))
        im = PIL.Image.open(image_bytes).convert('RGB')

        if resize:
            target_wh = self.width_height
            if (im.size[0] > im.size[1]) != (target_wh[0] > target_wh[1]):
                target_wh = (target_wh[1], target_wh[0])
            if im.size[0] != target_wh[0] or im.size[1] != target_wh[1]:
                print('!!! have to resize image to', target_wh, ' from ', im.size)
                im = im.resize(target_wh, PIL.Image.BICUBIC)
        width_height = im.size

        start = time.time()
        preprocess = openpifpaf.transforms.EVAL_TRANSFORM
        processed_image, _, __ = preprocess(im, [], None)
        print('preprocessing time', time.time() - start)

        image_tensors_batch = torch.unsqueeze(processed_image.float(), 0)
        pred_anns = self.processor.batch(self.model, image_tensors_batch, device=self.device)[0]

        keypoint_sets = [ann.data for ann in pred_anns]
        scores = [ann.score() for ann in pred_anns]

        # normalize scale
        for kps in keypoint_sets:
            kps[:, 0] /= (processed_image.shape[2] - 1)
            kps[:, 1] /= (processed_image.shape[1] - 1)

        return keypoint_sets, scores, width_height
