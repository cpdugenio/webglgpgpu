define(
    ["text", "text!shaders/maxpool.vs", "text!shaders/maxpool.fs",
        "createarray", "utils"],
    function(text, max_vs, max_fs, create_array, utils){
        return function Maxpool2D(gl, size, stride){
            /*
             * Maxpool 2D class
             *
             * Given:
             *     - gl context
             *     - pool size (square) TODO: Rectangular size
             *     - pool stride        TODO: Rectangular stride
             *
             * Ensure object has:
             *  forward(input_TWHDN):
             *      - Return your target texture
             *
             *  NOTE: This layer should maintain everything -
             *  It should create and hold the shaders, the program,
             *  It should also keep hold of the target texture (even)
             *
             */

            this.gl = gl;
            this.size = size;
            this.stride = stride;

            /********************************************************/
            /*                 SETUP SHADER                         */
            /********************************************************/

            /* Augment fragment shader */
            var aug_max_fs = "#version 300 es\n"
                              + "#define SIZE " + size + ".0 \n"
                              + "#define STRIDE " + stride + ".0 \n"
                              + "precision highp float;\n"
                              + "precision highp sampler3D;\n"
                              + max_fs;
            this.program = twgl.createProgramInfo(this.gl, [max_vs, aug_max_fs]);

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
                    'w': Math.ceil(input_TWHDN.w / this.stride),
                    'h': Math.ceil(input_TWHDN.h / this.stride),
                    /* NOTE: Only w, h changes */
                    'd': input_TWHDN.d,
                    'n': input_TWHDN.n,
                };
                this.output_T = create_array(gl, output_WHDN, null);

                /* Setup program draw buffer info */
                this.arrays.uv = {
                    numComponents: 2,
                    data: [
                         -0.5,              -0.5,
                         input_TWHDN.w-0.5, -0.5,
                         -0.5,              input_TWHDN.h-0.5,
                         input_TWHDN.w-0.5, input_TWHDN.h-0.5,
                    ],
                };
                this.bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays);
                this.framebufferAttachments = [
                    {
                        internalFormat: gl.R32F,
                        type: gl.FLOAT,
                    },
                ];
                this.framebufferInfo2D = twgl.createFramebufferInfo(
                    gl, this.framebufferAttachments, input_TWHDN.w, input_TWHDN.h);

                /* Begin forward pass */
                gl.useProgram(this.program.program);
                twgl.setBuffersAndAttributes(gl, this.program, this.bufferInfo);

                var uniforms = {
                    'input3d': input_TWHDN.t,
                    'inputdim': [input_TWHDN.x, input_TWHDN.y],
                    'inputindex': -1,
                };

                for(var input_slice=0; input_slice<input_TWHDN.d*input_TWHDN.n; input_slice++){
                    /* Need to do across all channels and layers */
                    /* Select correct target texture z-slice */
                    twgl.bindFramebufferInfo(gl, this.framebufferInfo2D);
                    gl.bindTexture(gl.TEXTURE_3D, this.output_T);
                    gl.framebufferTextureLayer(
                        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.output_T,
                        0, input_slice);

                    /* Setup uniforms */
                    uniforms.inputindex = input_slice;
                    twgl.setUniforms(this.program, uniforms);

                    /* Convolve! */
                    twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE_STRIP, 4);
                }

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
                output_WHDN.t = this.output_T;
                return output_WHDN;
            };
        }
    }
);
