require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    [
        "network",
        "utils",
        "createarray",
        "text!../res/convactive/cifar_test_preprocessed_0.txt",
    ], function(
            Network,
            utils,
            create_array,
            test_0_bs,
            ){
        /* SETUP GL */
        var gl = document.createElement("canvas").getContext("webgl2");
        this.canvasbody = document.getElementById("glcanvas");
        if (!gl) {
            var msg = document.createElement('div');
            msg.innerHTML = "Failed to obtain WebGL 2.0 context."
            document.body.removeChild(this.canvasbody)
            document.body.appendChild(msg);
            throw new Error("Failed to obtain WebGL 2.0 context.");
        }

        /* For float buffers */
        var ext = (
              gl.getExtension('EXT_color_buffer_float')
        );

        /* INJECT STATS */
        var stats;
        stats =  new Stats();
        stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );

        // Load test images once
        var test_0 = utils.loadbytestr(test_0_bs);

        /* Create network */
        var network = new Network(gl);

        /* Keep input stuff constant - Reload */
        var TEST_SIZE = 10;
        const input_WHDN = {
            'w': 32,
            'h': 32,
            'd': 3,
            'n': TEST_SIZE,
        };
        const input_data = new Float32Array(
                input_WHDN.w*input_WHDN.h*input_WHDN.d*input_WHDN.n);
        const input_labels = new Uint8Array(TEST_SIZE);
        const single_size = input_WHDN.w*input_WHDN.h*input_WHDN.d;
        const test_set_size = test_0.length / single_size;

        var loop = function*() {
            while(true){
                /* Generate Random Input */
                for(var i=0; i<TEST_SIZE; i++){
                    var ind = (
						(min, max) => {
							min = Math.ceil(min);
							max = Math.floor(max);
							return Math.floor(Math.random() * (max - min)) + min;
						})(0, test_set_size);

                    input_data.set(
                        test_0.subarray(single_size * ind, single_size * (ind + 1)),
                        i*single_size);
                    input_labels.set(
                        test_labels.subarray(ind, ind+1),
                        i);
                }

                var input_TWHDN = create_array(gl, input_WHDN, input_data);
                var probabilities = network.forward(input_TWHDN);
                var labels = utils.argmax(probabilities);
                console.log(input_labels);
                console.log(labels);

                yield;
            }
        }

        var coroutine = loop();
		function drawFrame(time) {
			// Run the "infinite" loop for a while
			for (var i = 0; i < 1; ++i) {
				coroutine.next();
			}
			
			/* Do things Here */

			// Keep the callback chain going
			requestAnimationFrame(drawFrame);
		}

		requestAnimationFrame(drawFrame);
    }
);
