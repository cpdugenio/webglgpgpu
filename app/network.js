define(
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
            return function Network(gl){
                var t_begin = performance.now();

                var t_setupinputb = performance.now();

                /* Load kernel/bias data */
                this.layer_1_k_WHDN = { 'n': 32,   'd': 3,    'w': 3,   'h': 3, };
                this.layer_2_k_WHDN = { 'n': 32,   'd': 32,   'w': 3,   'h': 3, };
                this.layer_3_k_WHDN = { 'n': 64,   'd': 32,   'w': 3,   'h': 3, };
                this.layer_4_k_WHDN = { 'n': 64,   'd': 64,   'w': 3,   'h': 3, };
                this.FC_1_k_WHDN =    { 'n': 1024, 'd': 64,   'w': 5,   'h': 5, };
                this.FC_2_k_WHDN =    { 'n': 256,  'd': 1024, 'w': 1,   'h': 1, };
                this.FC_3_k_WHDN =    { 'n': 10,   'd': 256,  'w': 1,   'h': 1, };

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
                this.layer_1 = new Convolution2D(gl, this.layer_1_k_WHDN, layer_1_k, layer_1_b);
                this.layer_2 = new Convolution2D(gl, this.layer_2_k_WHDN, layer_2_k, layer_2_b);
                this.layer_3 = new Convolution2D(gl, this.layer_3_k_WHDN, layer_3_k, layer_3_b);
                this.layer_4 = new Convolution2D(gl, this.layer_4_k_WHDN, layer_4_k, layer_4_b);
                this.FC_1 = new Convolution2D(gl, this.FC_1_k_WHDN, FC_1_k, FC_1_b);
                this.FC_2 = new Convolution2D(gl, this.FC_2_k_WHDN, FC_2_k, FC_2_b);
                this.FC_3 = new Convolution2D(gl, this.FC_3_k_WHDN, FC_3_k, FC_3_b);
                this.softmax = new Softmax(gl, 10);
                this.relu = new ReLU(gl);
                this.maxpool = new Maxpool2D(gl, 2, 2);

                var t_layersetupe = performance.now();

                this.forward = function(input_TWHDN){
                    var t_forwards = performance.now();

                    var layer_1_target =                      this.relu.forward(this.layer_1.forward(input_TWHDN));
                    var layer_2_target = this.maxpool.forward(this.relu.forward(this.layer_2.forward(layer_1_target)));
                    var layer_3_target =                      this.relu.forward(this.layer_3.forward(layer_2_target));
                    var layer_4_target = this.maxpool.forward(this.relu.forward(this.layer_4.forward(layer_3_target)));
                    var FC_1_target =                         this.relu.forward(this.FC_1.forward(layer_4_target));
                    var FC_2_target =                         this.relu.forward(this.FC_2.forward(FC_1_target));
                    var FC_3_target =                                           this.FC_3.forward(FC_2_target);
                    var prob = this.softmax.forward(FC_3_target);

                    var t_forwarde = performance.now();

                    return prob.p;
                }

                // console.log(t_layerbytese - t_layerbytess);
                // console.log(t_layersetupe - t_layersetups);
                // console.log(t_forwarde - t_forwards);
                // console.log(t_forwarde - t_begin);
            }
        }
);
