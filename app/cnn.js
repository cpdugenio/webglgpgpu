require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text",
        "convolution2d", "maxpool2d", "softmax",
        "createarray", "utils"],
    function(text, Convolution2D, Maxpool2D, Softmax, create_array, utils){
        /* SETUP GL */
        const gl = document.createElement("canvas").getContext("webgl2");
        const canvasbody = document.getElementById("glcanvas");
        if (!gl) {
            var msg = document.createElement('div');
            msg.innerHTML = "Failed to obtain WebGL 2.0 context."
            document.body.removeChild(canvasbody)
            document.body.appendChild(msg);
            throw new Error("Failed to obtain WebGL 2.0 context.");
        }

        /* INJECT STATS */
        var stats;
        stats =  new Stats();
        stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );

        /* For float buffers */
        var ext = (
              gl.getExtension('EXT_color_buffer_float')
        );

        /* PROPS */
        const input_WHDN = {
            'w': 16,
            'h': 16,
            'd': 1,
            'n': 1,
        };
        const input_data = new Float32Array(input_WHDN.w*input_WHDN.h);
        for(var i=0; i<input_data.length; i++){
            input_data[i] = i;
        }
        var input_TWHDN = create_array(gl, input_WHDN, input_data);

        const kernel_1_WHDN = {'w': 3, 'h': 3, 'd': 1, 'n': 1,};
        const kernel_1_data = new Float32Array(
            kernel_1_WHDN.w*kernel_1_WHDN.h*kernel_1_WHDN.d*kernel_1_WHDN.n);
        kernel_1_data.fill(1.0);

        const bias_1_WHDN = {'w': 3, 'h': 3, 'd': 1, 'n': 1,};
        const bias_1_data = new Float32Array(
            bias_1_WHDN.w*bias_1_WHDN.h*bias_1_WHDN.d*bias_1_WHDN.n);
        bias_1_data.fill(100.0);

        const fc_kernel_1_WHDN = {'w': 7, 'h': 7, 'd': 1, 'n': 4,};
        const fc_kernel_1_data = new Float32Array(
            fc_kernel_1_WHDN.w*fc_kernel_1_WHDN.h*fc_kernel_1_WHDN.d*fc_kernel_1_WHDN.n);
        for(var i=0; i<fc_kernel_1_WHDN.n; i++){
            for(var d=0; d<fc_kernel_1_WHDN.w*fc_kernel_1_WHDN.h*fc_kernel_1_WHDN.d; d++){
                fc_kernel_1_data[fc_kernel_1_WHDN.w*fc_kernel_1_WHDN.h*fc_kernel_1_WHDN.d*i+d] = i+1;
            }
        }

        /* Set up layers */
        var layer_1 = new Convolution2D(gl, kernel_1_WHDN, kernel_1_data, bias_1_WHDN, bias_1_data);
        var maxpool = new Maxpool2D(gl, 2, 2);

        utils.print_pixels(input_WHDN, input_data);
        var target_1_TWHDN = layer_1.forward(input_TWHDN);
        var target_maxpool_1 = maxpool.forward(target_1_TWHDN);
        console.log(target_maxpool_1);
    }
);
