require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs", "convolve", "createarray"],
    function(text, convolve_vs, convolve_fs, Convolution2D, create_array){
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
        const test_input_obj = {
            'w': 3,
            'h': 3,
            'd': 1,
            'n': 1,
        };
        const test_input_data = new Float32Array([
            2.0, 1.0, 1.0,
            1.0, 2.0, 1.0,
            1.0, 1.0, 2.0,
        ]);
        const test_kernel_obj = {
            'w': 2,
            'h': 2,
            'd': 1,
            'n': 1,
        };
        const test_kernel_data = new Float32Array(
            test_kernel_obj.w*test_kernel_obj.h*test_kernel_obj.d*test_kernel_obj.n);
        test_kernel_data.fill(1.0/(test_kernel_obj.w*test_kernel_obj.h));

        var test_input_T = create_array(gl, test_input_obj, test_input_data);
        var test_input_TWHDN = {
            'w': test_input_obj.w,
            'h': test_input_obj.h,
            'd': test_input_obj.d,
            'n': test_input_obj.n,
            't': test_input_T,
        }

        var test_layer = new Convolution2D(gl);
        test_layer.init(test_kernel_obj, test_kernel_data);
        var target_TWHDN = test_layer.forward(test_input_TWHDN);
        console.log(target_TWHDN);
    }
);
