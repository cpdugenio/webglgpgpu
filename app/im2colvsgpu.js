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
        stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );

        /* SETUP GL */
        const gl = document.createElement("canvas").getContext("webgl2");
        const canvasbody = document.getElementById("glcanvas");
        const context2d = document.createElement("canvas").getContext("2d");

        /* PROPS */
        const kwidth = 3;
        const kheight = 3;
        const kdepth = 3;
        const kcount = 500;
        const RGBA = 4;

        // var canvas = document.createElement( 'canvas' );
        // var context = canvas.getContext( '2d' );
        // context.drawImage( image, w, h, -w, -h );

        /* Get input image pixels */
        var image = document.getElementById("input");
        var iheight = image.height;
        var iwidth = image.width;
        var idepth = 3;
        var ctx = canvasbody.getContext('2d');
        canvasbody.width = iwidth;
        canvasbody.height = iheight;
        ctx.clearRect(0,0,iwidth,iheight)
        ctx.drawImage(image, 0, 0, iwidth, iheight, 0, 0, iwidth, iheight)
        /* inputdata_strided has RGBA (4) */
        const inputdata_strided = new Float32Array(
            canvasbody.getContext('2d').getImageData(0, 0, 32, 32).data
        );
        ctx.clearRect(0,0,iwidth,iheight)
        iheight = 32;
        iwidth = 32;
        const inputdata = new Float32Array(iwidth*iheight*idepth);
        for(var i=0; i<iwidth*iheight; i++){
            inputdata[iwidth*iheight*0+i] = inputdata_strided[4*i+0];
            inputdata[iwidth*iheight*1+i] = inputdata_strided[4*i+1];
            inputdata[iwidth*iheight*2+i] = inputdata_strided[4*i+2];
            // Don't need alpha channel -- there is none
        }

        const owidth = iwidth - kwidth + 1;
        const oheight = iheight - kheight + 1;
        const odepth = kcount;

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
        const kerneldata = new Float32Array(kwidth*kheight*kdepth*kcount);
        kerneldata.fill(1.0/(kwidth*kheight*3.0));
        
        const kernel3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: kwidth,
            height: kheight,
            depth: kdepth*kcount,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: kerneldata,
        });

        /* Target 3D texture  (X-A+1, Y-B+1, N) */
        const target3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: iwidth-kwidth+1,
            height: iheight-kheight+1,
            depth: kcount,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
        });

        twgl.bindFramebufferInfo(gl, framebufferInfo2D);
        gl.useProgram(convolveProgram.program);
        twgl.setBuffersAndAttributes(gl, convolveProgram, bufferInfo);

        // render(0);
        function render(time){
            stats.begin();

            glsl_convolve();

            stats.end();
            requestAnimationFrame(render);
        }
        // requestAnimationFrame(render);


        /* Convolve */
        function glsl_convolve_init(input, kernel){
            /* Initialize all the good stuff for glsl_convolve */
        }

        function glsl_convolve(){
            /* Returns output convolution object with data, width,
             * height, dim
             *
             * input: object with data, width, height, dim
             * kernel: object with data, width, height, dim
             *
             * Assumes glsl_convolve_init() has been run
             *
             */
            for(var d=0; d<kcount; d++)
            {
                // TOOD: SELECT CORRECT TARGET TEXTURE Z-SLICE
                const uniforms = {
                    input3d: input3d,
                    kernel3d: kernel3d,
                    kernelindex: d,
                };
                twgl.setUniforms(convolveProgram, uniforms);
                twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);

                // var framebufferDump2D = new Float32Array(owidth*oheight*4);
                // gl.readPixels(0, 0, owidth, oheight, gl.RGBA, gl.FLOAT, framebufferDump2D)
                // var framebufferDump = new Float32Array(
                //     framebufferDump2D.filter(function (d, i) { return i % 4 == 0; }));
                // console.log(framebufferDump);

                // var myImageData = ctx.createImageData(owidth, oheight);
                // for(var i=0; i<framebufferDump.length; i++){
                //     myImageData.data[i*4+0] = framebufferDump[i];
                //     myImageData.data[i*4+1] = framebufferDump[i];
                //     myImageData.data[i*4+2] = framebufferDump[i];
                //     myImageData.data[i*4+3] = 255;
                // }
                // console.log(myImageData.data.length);
                // console.log(framebufferDump.length*4);
                // canvasbody.width = owidth;
                // canvasbody.height = oheight;
                // ctx.clearRect(0,0,owidth,oheight)
                // ctx.putImageData(myImageData, 0, 0);
            }
        }
        var minny = 10000.0;
        for(var x=0; x<100; x++){
            var start = performance.now();
            glsl_convolve();
            var end = performance.now();
            var duration = end - start;
            if(duration < minny){
                minny = duration;
            }
        }
        console.log(minny);

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

