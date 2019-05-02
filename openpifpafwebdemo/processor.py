import base64
import io
import time
import re

import PIL
import torch

import openpifpaf


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
        target_wh = (int(640 * self.resolution), int(480 * self.resolution))
        if not landscape:
            target_wh = (int(480 * self.resolution), int(640 * self.resolution))
        if im.size[0] != target_wh[0] or im.size[1] != target_wh[1]:
            print('!!! have to resize image to', target_wh, ' from ', im.size)
            im = im.resize(target_wh, PIL.Image.BICUBIC)
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
