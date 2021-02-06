import logging
import random
import re
import string

LOG = logging.getLogger(__name__)
VALID_KEY = re.compile(r'^\w{6}$', re.ASCII)
KEY_CHARS = string.ascii_letters + string.digits


def generate(length):
    return ''.join(random.choice(KEY_CHARS) for _ in range(length))


def validate(key):
    return VALID_KEY.search(key)
