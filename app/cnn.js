require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs",
        "convolve", "createarray", "utils"],
    function(text, convolve_vs, convolve_fs,
            Convolution2D, create_array, utils){
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
            'w': 3,
            'h': 3,
            'd': 1,
            'n': 1,
        };
        const input_data = new Float32Array([
            2.0, 1.0, 1.0,
            1.0, 2.0, 1.0,
            1.0, 1.0, 2.0,
        ]);
        const kernel_1_WHDN = {
            'w': 2,
            'h': 2,
            'd': 1,
            'n': 1,
        };
        const kernel_1_data = new Float32Array([
            1.0, 0.5,
            0.5, 1.0,
        ]);
        const kernel_2_WHDN = {
            'w': 2,
            'h': 2,
            'd': 1,
            'n': 1,
        };
        const kernel_2_data = new Float32Array([
            0.5, 1.0,
            1.0, 0.5,
        ]);

        var input_T = create_array(gl, input_WHDN, input_data);
        var input_TWHDN = {
            'w': input_WHDN.w,
            'h': input_WHDN.h,
            'd': input_WHDN.d,
            'n': input_WHDN.n,
            't': input_T,
        }

        var layer_1 = new Convolution2D(gl);
        layer_1.init(kernel_1_WHDN, kernel_1_data);

        var layer_2 = new Convolution2D(gl);
        layer_2.init(kernel_2_WHDN, kernel_2_data);

        utils.print_pixels(input_WHDN, input_data);
        var target_1_TWHDN = layer_1.forward(input_TWHDN);
        var target_2_TWHDN = layer_2.forward(target_1_TWHDN);
    }
);
