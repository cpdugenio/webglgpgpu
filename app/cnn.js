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
        "text!../res/convactive/cifar_test_preprocessed_0.txt",
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
        test_0_bs,
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

        var t_begin = performance.now();

        var t_setupinputb = performance.now();

        /* PROPS */
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

        var t_setupinpute = performance.now();

        var t_layerbytess = performance.now();

        /* Load kernel/bias data */
        var layer_1_k_WHDN = { 'n': 32,   'd': 3,    'w': 3,   'h': 3, };
        var layer_2_k_WHDN = { 'n': 32,   'd': 32,   'w': 3,   'h': 3, };
        var layer_3_k_WHDN = { 'n': 64,   'd': 32,   'w': 3,   'h': 3, };
        var layer_4_k_WHDN = { 'n': 64,   'd': 64,   'w': 3,   'h': 3, };
        var FC_1_k_WHDN =    { 'n': 1024, 'd': 64,   'w': 5,   'h': 5, };
        var FC_2_k_WHDN =    { 'n': 256,  'd': 1024, 'w': 1,   'h': 1, };
        var FC_3_k_WHDN =    { 'n': 10,   'd': 256,  'w': 1,   'h': 1, };

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

        var t_layerbytese = performance.now();
        var t_layersetups = performance.now();

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

        var t_layersetupe = performance.now();
        var t_forwards = performance.now();

        var layer_1_target = relu.forward(layer_1.forward(input_TWHDN));
        var layer_2_target = maxpool.forward(relu.forward(layer_2.forward(layer_1_target)));
        var layer_3_target = relu.forward(layer_3.forward(layer_2_target));
        var layer_4_target = maxpool.forward(relu.forward(layer_4.forward(layer_3_target)));
        var FC_1_target = relu.forward(FC_1.forward(layer_4_target));
        var FC_2_target = relu.forward(FC_2.forward(FC_1_target));
        var FC_3_target =              FC_3.forward(FC_2_target);
        var prob = softmax.forward(FC_3_target);

        console.log(prob.p);
        console.log(utils.argmax(prob.p));

        var t_forwarde = performance.now();
        // console.log(t_layerbytese - t_layerbytess);
        // console.log(t_layersetupe - t_layersetups);
        // console.log(t_forwarde - t_forwards);
        // console.log(t_forwarde - t_begin);
    }
);
