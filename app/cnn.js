require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text",
        "text!../res/convactive/layer_1_convolution.kernel.txt", "text!../res/convactive/layer_1_convolution.bias.txt",
        "text!../res/convactive/layer_2_convolution.kernel.txt", "text!../res/convactive/layer_2_convolution.bias.txt",
        "text!../res/convactive/layer_3_convolution.kernel.txt", "text!../res/convactive/layer_3_convolution.bias.txt",
        "text!../res/convactive/layer_4_convolution.kernel.txt", "text!../res/convactive/layer_4_convolution.bias.txt",
        "text!../res/convactive/FC_1.kernel.txt", "text!../res/convactive/FC_1.bias.txt",
        "text!../res/convactive/FC_2.kernel.txt", "text!../res/convactive/FC_2.bias.txt",
        "text!../res/convactive/FC_3.kernel.txt", "text!../res/convactive/FC_3.bias.txt",
        "convolution2d", "maxpool2d", "softmax", "relu",
        "createarray", "utils"],
    function(text,
        layer_1_k_bs, layer_1_b_bs,
        layer_2_k_bs, layer_2_b_bs,
        layer_3_k_bs, layer_3_b_bs,
        layer_4_k_bs, layer_4_b_bs,
        FC_1_k_bs, FC_1_b_bs,
        FC_2_k_bs, FC_2_b_bs,
        FC_3_k_bs, FC_3_b_bs,
        Convolution2D, Maxpool2D, Softmax, ReLU,
        create_array, utils){
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
            'w': 32,
            'h': 32,
            'd': 3,
            'n': 1,
        };
        const input_data = new Float32Array(input_WHDN.w*input_WHDN.h*input_WHDN.d*input_WHDN.n);
        input_data.fill(1.0);
        var input_TWHDN = create_array(gl, input_WHDN, input_data);

        /* Load kernel/bias data */
        var layer_1_k_WHDN = { 'n': 8,    'd': 3,    'w': 3,   'h': 3, };
        var layer_2_k_WHDN = { 'n': 8,    'd': 8,    'w': 3,   'h': 3, };
        var layer_3_k_WHDN = { 'n': 16,   'd': 8,    'w': 3,   'h': 3, };
        var layer_4_k_WHDN = { 'n': 16,   'd': 16,   'w': 3,   'h': 3, };
        var FC_1_k_WHDN =    { 'n': 128,  'd': 16,   'w': 5,   'h': 5, };
        var FC_2_k_WHDN =    { 'n': 64,   'd': 128,  'w': 1,   'h': 1, };
        var FC_3_k_WHDN =    { 'n': 10,   'd': 64,   'w': 1,   'h': 1, };

        var layer_1_k = utils.loadbytestr(layer_1_k_bs);
        var layer_1_b = utils.loadbytestr(layer_1_b_bs);

        var layer_2_k = utils.loadbytestr(layer_2_k_bs);
        var layer_2_b = utils.loadbytestr(layer_2_b_bs);

        var layer_3_k = utils.loadbytestr(layer_3_k_bs);
        var layer_3_b = utils.loadbytestr(layer_3_b_bs);

        var layer_4_k = utils.loadbytestr(layer_4_k_bs);
        var layer_4_b = utils.loadbytestr(layer_4_b_bs);

        var FC_1_k = utils.loadbytestr(FC_1_k_bs);
        var FC_1_b = utils.loadbytestr(FC_1_b_bs);

        var FC_2_k = utils.loadbytestr(FC_2_k_bs);
        var FC_2_b = utils.loadbytestr(FC_2_b_bs);

        var FC_3_k = utils.loadbytestr(FC_3_k_bs);
        var FC_3_b = utils.loadbytestr(FC_3_b_bs);

        /* Set up layers */
        var layer_1 = new Convolution2D(gl, layer_1_k_WHDN, layer_1_k, layer_1_b);
        var layer_2 = new Convolution2D(gl, layer_2_k_WHDN, layer_2_k, layer_2_b);
        var layer_3 = new Convolution2D(gl, layer_3_k_WHDN, layer_3_k, layer_3_b);
        var layer_4 = new Convolution2D(gl, layer_4_k_WHDN, layer_4_k, layer_4_b);
        var FC_1 = new Convolution2D(gl, FC_1_k_WHDN, FC_1_k, FC_1_b);
        var FC_2 = new Convolution2D(gl, FC_2_k_WHDN, FC_2_k, FC_2_b);
        var FC_3 = new Convolution2D(gl, FC_3_k_WHDN, FC_3_k, FC_3_b);
        var softmax = new Softmax(gl, 10);
        var relu = new ReLU(gl);
        var maxpool = new Maxpool2D(gl, 2, 2);

        var layer_1_target = relu.forward(layer_1.forward(input_TWHDN));
        var layer_2_target = maxpool.forward(relu.forward(layer_2.forward(layer_1_target)));
        var layer_3_target = relu.forward(layer_3.forward(layer_2_target));
        var layer_4_target = maxpool.forward(relu.forward(layer_4.forward(layer_3_target)));
        var FC_1_target = relu.forward(FC_1.forward(layer_4_target));
        var FC_2_target = relu.forward(FC_2.forward(FC_1_target));
        var FC_3_target =              FC_3.forward(FC_2_target);
        var prob = softmax.forward(FC_3_target);
    }
);
