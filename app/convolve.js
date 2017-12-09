define(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs",
        "createarray", "utils"],
    function(text, convolve_vs, convolve_fs, create_array, utils){
        return function Convolution2D(gl){
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

            this.init = function(kernel_WHDN, kernel_data){
                /********************************************************/
                /*                 SETUP SHADER                         */
                /********************************************************/

                /* Augment fragment shader */
                var aug_convolve_fs = "#version 300 es\n"
                                  + "#define KU " + kernel_WHDN.w + ".0 \n"
                                  + "#define KV " + kernel_WHDN.h + ".0 \n"
                                  + "#define KW " + kernel_WHDN.d + ".0 \n"
                                  + "precision highp float;\n"
                                  + "precision highp sampler3D;\n"
                                  + convolve_fs;
                this.program = twgl.createProgramInfo(this.gl, [convolve_vs, aug_convolve_fs]);
                this.kernel_T = create_array(this.gl, kernel_WHDN, kernel_data);
                this.kernel_TWHDN = {
                    'w': kernel_WHDN.w,
                    'h': kernel_WHDN.h,
                    'd': kernel_WHDN.d,
                    'n': kernel_WHDN.n,
                    't': this.kernel_T,
                };
            };

            this.forward = function(input_TWHDN){
                /* Setup program draw buffer info */
                var arrays = {
                    position: {
                        numComponents: 2,
                        data: [
                            -1.0, -1.0,
                            +1.0, -1.0,
                            -1.0, +1.0,
                            +1.0, +1.0,
                        ],
                    },
                    uv: {
                        numComponents: 2,
                        data: [
                            -0.5,              -0.5,
                            -0.5,              input_TWHDN.w-0.5,
                            input_TWHDN.h-0.5, -0.5,
                            input_TWHDN.h-0.5, input_TWHDN.w-0.5,
                        ],
                    },
                };
                this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
                this.framebufferAttachments = [
                    {
                        internalFormat: gl.R32F,
                        type: gl.FLOAT,
                    },
                ];
                this.framebufferInfo2D = twgl.createFramebufferInfo(
                    gl, this.framebufferAttachments, input_TWHDN.w, input_TWHDN.h);

                /* Setup target texture */
                var output_WHDN = {
                    'w': input_TWHDN.w - this.kernel_TWHDN.w + 1,
                    'h': input_TWHDN.h - this.kernel_TWHDN.h + 1,
                    'd': this.kernel_TWHDN.n,
                    'n': input_TWHDN.n,
                };
                this.output_T = create_array(gl, output_WHDN, null);

                /* Begin forward pass */
                gl.useProgram(this.program.program);
                twgl.setBuffersAndAttributes(gl, this.program, this.bufferInfo);

                var uniforms = {
                    'input3d': input_TWHDN.t,
                    'kernel3d': this.kernel_TWHDN.t,
                    'kernelindex': -1,
                    'inputindex': -1,
                };

                for(var input_slice=0; input_slice<input_TWHDN.n; input_slice++){
                    for(var kernel_slice=0; kernel_slice<this.kernel_TWHDN.n; kernel_slice++)
                    {
                        /* Select correct target texture z-slice */
                        twgl.bindFramebufferInfo(gl, this.framebufferInfo2D);
                        gl.bindTexture(gl.TEXTURE_3D, this.output_T);
                        gl.framebufferTextureLayer(
                            gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, this.output_T,
                            0, input_slice*this.kernel_TWHDN.n+kernel_slice);

                        /* Setup uniforms */
                        uniforms.kernelindex = kernel_slice;
                        uniforms.inputindex = input_slice;
                        twgl.setUniforms(this.program, uniforms);

                        /* Convolve! */
                        twgl.drawBufferInfo(gl, this.bufferInfo, gl.TRIANGLE_STRIP, 4);
                    }
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
