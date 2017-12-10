define(
    ["text", "text!shaders/softmax.vs", "text!shaders/softmax.fs",
        "createarray", "utils"],
    function(text, softmax_vs, softmax_fs, create_array, utils){
        return function Softmax(gl, logit_count){
            /*
             * Softmax 2D class
             *
             * Given:
             *     - gl context
             *     - logit count
             *
             * Ensure object has:
             *  forward(input_TWHDN):
             *      - Return your target texture
             *      - Assumes input_is 1x1x(d*n) 3D texture
             *      - Outputs 2D texture (1 channel, 1 count)
             *      - Along x is classification
             *      - Along y is group
             *
             *  NOTE: This layer should maintain everything -
             *  It should create and hold the shaders, the program,
             *  It should also keep hold of the target texture (even)
             *
             */

            this.gl = gl;
            this.logit_count = logit_count;

            /********************************************************/
            /*                 SETUP SHADER                         */
            /********************************************************/

            /* Augment fragment shader */
            var aug_softmax_fs = "#version 300 es\n"
                              + "#define COUNT " + logit_count + ".0 \n"
                              + "precision highp float;\n"
                              + "precision highp sampler3D;\n"
                              + softmax_fs;
            this.program = twgl.createProgramInfo(this.gl, [softmax_vs, aug_softmax_fs]);

            this.arrays = {
                position: {
                    numComponents: 2,
                    data: [
                        -1.0, -1.0,
                        +1.0, -1.0,
                        -1.0, +1.0,
                        +1.0, +1.0,
                    ],
                },
            };

            this.forward = function(input_TWHDN){
                /* Setup target texture */
                var output_WHDN = {
                    /* NOTE: Incoming is 1x1x(d*n)
                     * -> Reshaping to dxnx1x1 */
                    'w': input_TWHDN.d,
                    'h': input_TWHDN.n,
                    'd': 1,
                    'n': 1,
                };
                this.output_TWHDN = create_array(gl, output_WHDN, null);

                /* Setup program draw buffer info */
                this.arrays.uv = {
                    numComponents: 2,
                    data: [
                        -0.5,              -0.5,              
                        input_TWHDN.d-0.5, -0.5,              
                        -0.5,              input_TWHDN.n-0.5, 
                        input_TWHDN.d-0.5, input_TWHDN.n-0.5, 
                    ],
                };
                var bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays);
                var framebufferAttachments = [
                    {
                        internalFormat: gl.R32F,
                        type: gl.FLOAT,
                    },
                ];
                var framebufferInfo2D = twgl.createFramebufferInfo(
                    gl, framebufferAttachments, input_TWHDN.d, input_TWHDN.n);

                /* Begin forward pass */
                gl.useProgram(this.program.program);
                twgl.setBuffersAndAttributes(gl, this.program, bufferInfo);

                /* Select correct target texture z-slice */
                twgl.bindFramebufferInfo(gl, framebufferInfo2D);
                gl.bindTexture(gl.TEXTURE_3D, this.output_TWHDN.t);
                gl.framebufferTextureLayer(
                    gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.output_TWHDN.t,
                    0, 0);


                var uniforms = {
                    'input3d': input_TWHDN.t,
                };

                /* Setup uniforms */
                twgl.setUniforms(this.program, uniforms);

                /* Softmax! */
                twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);

                if(1){
                    /* Debugging purposes */
                    var framebufferDump2D = new Float32Array(output_WHDN.w*output_WHDN.h*4);
                    gl.readPixels(0, 0, output_WHDN.w, output_WHDN.h, gl.RGBA, gl.FLOAT, framebufferDump2D)
                    var framebufferDump = new Float32Array(
                        framebufferDump2D.filter(function (data, i) { return i % 4 == 0; }));
                    utils.print_pixels(output_WHDN, framebufferDump);
                }

                /* Target should be all set, return */
                /* output_WHDN is now output_TWHDN */
                return this.output_TWHDN;
            };
        }
    }
);
