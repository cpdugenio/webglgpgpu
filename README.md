# GPGPU With WebGL

I decided to use GPGPU programming with CNNs.

This app executes CNN (forward) on CIFAR-10 with included trained model weights.
__There is no reason why anyone should write this.__

This was written for educational purposes and was used as a means to learn
JavaScript.. (There are tons of better ways to learn JavaScript.)

__If you want to write something like this, don't.
[TensorFlow.js](https://www.tensorflow.org/js) Exists.__

## Usage

Requires bower.

Gather requirements:

    bower install

Run on [http://localhost:8008](http://localhost:8008):

    make server

Navigate to [http://localhost:8008/cnn.html](http://localhost:8008/cnn.html).
Wait for your browser to explode trying to begin CIFAR-10 classification.

It's been about two years since I wrote this and I was silly enough to not keep
an active readme. I believe if you open up the console, for every iteration,
some particular sample is computed (`TEST_SIZE`: Default 10). The first line
printed is the true label. The second line printed is the classified label.

I believe I trained the exact model in TensorFlow and dumped the weights to be
used here.

I lost track of a few local commits that extract the ground truth and compare
against the probabilities computed for each catagory, so this should be possible
to do.
