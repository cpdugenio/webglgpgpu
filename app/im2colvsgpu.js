require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs"],
    function(text, convolve_vs, convolve_fs){
        /* INJECT STATS */
        var stats;
        stats =  new Stats();
        stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );

        /* PROPS */
        const iwidth = 2;
        const iheight = 2;
        const idepth = 2;
        const kwidth = 1;
        const kheight = 1;
        const kdepth = 2;
        const kcount = 2;
        const owidth = iwidth - kwidth + 1;
        const oheight = iheight - kheight + 1;
        const odepth = kcount;
        const RGBA = 4;

        /* SETUP GL */
        // const gl = document.getElementById("glcanvas").getContext("webgl2");
        const gl = document.createElement("canvas").getContext("webgl2");

        /* For float buffers */
        var ext = (
              gl.getExtension('EXT_color_buffer_float')
        );

        /* Augment fragment shader */
        convolve_fs = "#version 300 es\n"
                      + "#define KU " + kwidth + "\n"
                      + "#define KV " + kheight + "\n"
                      + "#define KW " + kdepth + "\n"
                      + "precision highp float;\n"
                      + "precision highp sampler3D;\n" + convolve_fs;
        const convolveProgram = twgl.createProgramInfo(gl, [convolve_vs, convolve_fs]);

        const arrays = {
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
                    -0.5, -0.5,
                    -0.5, iwidth-0.5,
                    iheight-0.5, -0.5,
                    iheight-0.5, iwidth-0.5,
                ],
            },
        };
        const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

        const framebufferAttachments = [
            {
                internalFormat: gl.R32F,
                type: gl.FLOAT,
            },
        ];
        const framebufferInfo2D = twgl.createFramebufferInfo(gl, framebufferAttachments, iwidth, iheight);

        /* Input 3D texture   (X, Y, Z) */
        const inputdata = new Float32Array([
            1, 2,
            3, 4,
            101, 102,
            103, 104,
        ]);
        const input3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: iwidth,
            height: iheight,
            depth: idepth,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: inputdata,
        });


        /* Kernel 3D texture  (A, B, Z*N) */
        const kerneldata = new Float32Array([
            1,
            2,
            3,
            4,
        ]);
        const kernel3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: kwidth,
            height: kheight,
            depth: kdepth*kcount,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: kerneldata,
        });

        /* Output 3D texture  (X-A+1, Y-B+1, N) */
        render(0);
        function render(time){
            stats.begin();

            // ensure we're drawing to canvas
            twgl.bindFramebufferInfo(gl, framebufferInfo2D);

            const uniforms = {
                input3d: input3d,
                kernel3d: kernel3d,
                kernelindex: 1,
            };

            gl.useProgram(convolveProgram.program);
            twgl.setBuffersAndAttributes(gl, convolveProgram, bufferInfo);
            twgl.setUniforms(convolveProgram, uniforms);
            twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);

            var framebufferDump2D = new Float32Array(iwidth*iheight*RGBA);
            gl.readPixels(0, 0, iwidth, iheight, gl.RGBA, gl.FLOAT, framebufferDump2D)
            console.log(framebufferDump2D.filter(function (d, i) { return i % 4 == 0; }));

            stats.end();
            // requestAnimationFrame(render);
        }
        // requestAnimationFrame(render);


        /* Convolve */

        function glsl_convolve_init(input, kernel){
            /* Initialize all the good stuff for glsl_convolve */

        }

        function glsl_convolve(input, kernel){
            /* Returns output convolution object with data, width,
             * height, dim
             *
             * input: object with data, width, height, dim
             * kernel: object with data, width, height, dim
             *
             * Assumes glsl_convolve_init() has been run
             *
             */
        }

        function im2col_convolve(input, kernel){
            /* Returns output convolution object with data, width,
             * height, dim
             *
             * input: object with data, width, height, dim
             * kernel: object with data, width, height, dim
             *
             */

        }
    }
);

