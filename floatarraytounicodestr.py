#!/usr/bin/env python
"""
Function for taking in 1-D iterator of floats and outputting an RGBA image to
encode (for use in JavaScript: Read RGBA values, dump data into Float32Array).

"""
import codecs
import numpy as np
from PIL import Image

def encode(array, output_filename=None):
    array_flat_32f = array.reshape(-1).astype(np.float32)
    array_uint8 = array_flat_32f.view(np.uint8)
    unicode_str = u''.join(map(lambda x: unichr(x), array_uint8))
    if output_filename is not None:
        with codecs.open(output_filename, encoding='utf-8', mode='w+') as f:
            f.write(unicode_str)
    else:
        return unicode_str

if __name__ == "__main__":
    array = np.asarray([2.0/3.0, 1.0/3.0, -1.121])
    encoded = encode(array, 'unidump.txt')
