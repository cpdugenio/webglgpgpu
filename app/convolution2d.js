define(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs",
        "createarray", "utils"],
    function(text, convolve_vs, convolve_fs, create_array, utils){
        return function Convolution2D(gl,
                kernel_WHDN, kernel_data, bias_data){
            /*
             * Convolution 2D class
             *
             * Given:
             *     - gl context
             *
             * Ensure object has:
             *  init(kernel_WHDN, kernel_data):
             *      - Ensure kernel texture is set
             *  forward(input_TWHDN):
             *      - Return your target texture
             *
             *  NOTE: This layer should maintain everything -
             *  It should create and hold the shaders, the program,
             *  It should also keep hold of the target texture (even)
             *
             */

            this.gl = gl;

            /********************************************************/
            /*                 SETUP SHADER                         */
            /********************************************************/

            /* Augment fragment shader */
            const aug_convolve_fs = "#version 300 es\n"
                              + "#define KU " + kernel_WHDN.w + ".0 \n"
                              + "#define KV " + kernel_WHDN.h + ".0 \n"
                              + "#define KW " + kernel_WHDN.d + ".0 \n"
                              + "precision highp float;\n"
                              + "precision highp sampler3D;\n"
                              + convolve_fs;
            this.program = twgl.createProgramInfo(this.gl, [convolve_vs, aug_convolve_fs]);
            this.kernel_TWHDN = create_array(this.gl, kernel_WHDN, kernel_data);

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
                    'w': input_TWHDN.w - this.kernel_TWHDN.w + 1,
                    'h': input_TWHDN.h - this.kernel_TWHDN.h + 1,
                    'd': this.kernel_TWHDN.n,
                    'n': input_TWHDN.n,
                };
                var output_TWHDN = create_array(gl, output_WHDN, null);

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
                var bufferInfo = twgl.createBufferInfoFromArrays(gl, this.arrays);
                framebufferAttachments = [
                    {
                        internalFormat: gl.R32F,
                        type: gl.FLOAT,
                    },
                ];
                framebufferInfo2D = twgl.createFramebufferInfo(
                    gl, framebufferAttachments, input_TWHDN.w, input_TWHDN.h);

                /* Begin forward pass */
                gl.useProgram(this.program.program);
                twgl.setBuffersAndAttributes(gl, this.program, bufferInfo);

                var uniforms = {
                    'inputdepth': input_TWHDN.d,
                    'kernelindex': -1,
                    'inputindex': -1,
                    'bias': -1,
                    'input3d': null,
                    'kernel3d': null,
                };

                for(var input_slice=0; input_slice<input_TWHDN.n; input_slice++){
                    for(var kernel_slice=0; kernel_slice<this.kernel_TWHDN.n; kernel_slice++){
                        /* Select correct target texture z-slice */
                        twgl.bindFramebufferInfo(gl, framebufferInfo2D);
                        gl.bindTexture(gl.TEXTURE_3D, output_TWHDN.t[input_slice]);
                        gl.framebufferTextureLayer(
                            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, output_TWHDN.t[input_slice],
                            0, kernel_slice);

                        /* Setup uniforms */
                        uniforms.kernelindex = kernel_slice;
                        uniforms.inputindex = input_slice;
                        uniforms.bias = bias_data[kernel_slice];
                        uniforms.input3d = input_TWHDN.t[input_slice];
                        uniforms.kernel3d = this.kernel_TWHDN.t[kernel_slice];
                        twgl.setUniforms(this.program, uniforms);

                        /* Convolve! */
                        twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);
                    }
                }

                if(gl.DEBUG){
                    console.log("\n");
                    for(var input_slice=0; input_slice<input_TWHDN.n; input_slice++){
                        for(var kernel_slice=0; kernel_slice<this.kernel_TWHDN.n; kernel_slice++){
                            /* Debugging purposes */
                            gl.framebufferTextureLayer(
                                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, output_TWHDN.t[input_slice],
                                0, kernel_slice);
                            var framebufferDump2D = new Float32Array(output_WHDN.w*output_WHDN.h*4);
                            gl.readPixels(0, 0, output_WHDN.w, output_WHDN.h, gl.RGBA, gl.FLOAT, framebufferDump2D)
                            var framebufferDump = new Float32Array(
                                framebufferDump2D.filter(function (data, i) { return i % 4 == 0; }));
                            utils.print_pixels(output_WHDN, framebufferDump);
                        }
                    }
                }

                /* Target should be all set, return */
                return output_TWHDN;
            };
        }
    }
);
