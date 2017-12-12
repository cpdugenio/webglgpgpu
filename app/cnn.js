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

        /* INPUT */
        const input_WHDN = {
            'w': 32,
            'h': 32,
            'd': 3,
            'n': 10,
        };
        var test_0 = utils.loadbytestr(test_0_bs);
        var ind = 1;
        var ct = input_WHDN.w*input_WHDN.h*input_WHDN.d;
        const input_data = new Float32Array(
            test_0.subarray(ct * ind, ct  * (ind + input_WHDN.n))
        );
        console.log(test_labels.subarray(ind,ind+input_WHDN.n));
        var input_TWHDN = create_array(gl, input_WHDN, input_data);

        /* Create network */
        var network = new Network(gl);
        var probabilities = network.forward(input_TWHDN);
        var labels = utils.argmax(probabilities);
        console.log(labels);
    }
);
