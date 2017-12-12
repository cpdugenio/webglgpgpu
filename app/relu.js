define(
    ["text", "text!shaders/relu.vs", "text!shaders/relu.fs",
        "createarray", "utils"],
    function(text, relu_vs, relu_fs, create_array, utils){
        return function ReLU(gl){
            /*
             * ReLU 2D class
             *
             * Given:
             *     - gl context
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

            /********************************************************/
            /*                 SETUP SHADER                         */
            /********************************************************/

            this.program = twgl.createProgramInfo(this.gl, [relu_vs, relu_fs]);

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
                    /* NOTE: NOTHING CHANGES */
                    'w': input_TWHDN.w,
                    'h': input_TWHDN.h,
                    'd': input_TWHDN.d,
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
                var framebufferAttachments = [
                    {
                        internalFormat: gl.R32F,
                        type: gl.FLOAT,
                    },
                ];
                var framebufferInfo2D = twgl.createFramebufferInfo(
                    gl, framebufferAttachments, input_TWHDN.w, input_TWHDN.h);

                /* Begin forward pass */
                gl.useProgram(this.program.program);
                twgl.setBuffersAndAttributes(gl, this.program, bufferInfo);

                var uniforms = {
                    'input3d': null,
                    'inputindex': -1,
                };

                for(var input_slice=0; input_slice<input_TWHDN.n; input_slice++){
                    for(var depth_slice=0; depth_slice<input_TWHDN.d; depth_slice++){
                        /* Need to do across all channels and layers */
                        /* Select correct target texture z-slice */
                        twgl.bindFramebufferInfo(gl, framebufferInfo2D);
                        gl.bindTexture(gl.TEXTURE_3D, output_TWHDN.t[input_slice]);
                        gl.framebufferTextureLayer(
                            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, output_TWHDN.t[input_slice],
                            0, depth_slice);

                        /* Setup uniforms */
                        uniforms.inputindex = depth_slice;
                        uniforms.input3d = input_TWHDN.t[input_slice];
                        twgl.setUniforms(this.program, uniforms);

                        /* Convolve! */
                        twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);
                    }
                }

                if(gl.DEBUG){
                    for(var input_slice=0; input_slice<input_TWHDN.n; input_slice++){
                        for(var depth_slice=0; depth_slice<input_TWHDN.d; depth_slice++){
                            gl.framebufferTextureLayer(
                                gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, output_TWHDN.t[input_slice],
                                0, depth_slice);
                            /* Debugging purposes */
                            var framebufferDump2D = new Float32Array(output_WHDN.w*output_WHDN.h*4);
                            gl.readPixels(0, 0, output_WHDN.w, output_WHDN.h, gl.RGBA, gl.FLOAT, framebufferDump2D)
                            var framebufferDump = new Float32Array(
                                framebufferDump2D.filter(function (data, i) { return i % 4 == 0; }));
                            utils.print_pixels(output_WHDN, framebufferDump);
                        }
                    }
                }

                /* Target should be all set, return */
                /* output_WHDN is now output_TWHDN */
                return output_TWHDN;
            };
        }
    }
);
