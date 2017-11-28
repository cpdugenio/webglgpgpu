require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text", "text!shaders/convolve.vs", "text!shaders/convolve.fs", "text!shaders/drawtexture.vs", "text!shaders/drawtexture.fs"],
    function(text, convolve_vs, convolve_fs, tex_vs, tex_fs){
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
        const context2d = document.createElement("canvas").getContext("2d");

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
        const kwidth = 20;
        const kheight = 20;
        const kdepth = 1;
        const kcount = 1;
        const RGBA = 4;

        // var canvas = document.createElement( 'canvas' );
        // var context = canvas.getContext( '2d' );
        // context.drawImage( image, w, h, -w, -h );

        /* Get input image pixels */
        var image = document.getElementById("input");
        var iheight = image.height;
        var iwidth = image.width;
        var idepth = 1;
        var icount = 3;
        var ctx = canvasbody.getContext('2d');
        canvasbody.width = iwidth;
        canvasbody.height = iheight;
        ctx.clearRect(0,0,iwidth,iheight)
        ctx.drawImage(image, 0, 0, iwidth, iheight, 0, 0, iwidth, iheight)
        /* inputdata_strided has RGBA (4) */
        const inputdata_strided = new Float32Array(
            // canvasbody.getContext('2d').getImageData(0, 0, 32, 32).data
            canvasbody.getContext('2d').getImageData(0, 0, iwidth, iheight).data
        );
        ctx.clearRect(0,0,iwidth,iheight)
        // iheight = 32;
        // iwidth = 32;
        const inputdata = new Float32Array(iwidth*iheight*idepth*icount);
        for(var i=0; i<iwidth*iheight; i++){
            inputdata[iwidth*iheight*0+i] = inputdata_strided[4*i+0];
            inputdata[iwidth*iheight*1+i] = inputdata_strided[4*i+1];
            inputdata[iwidth*iheight*2+i] = inputdata_strided[4*i+2];
            // Don't need alpha channel -- there is none
        }

        const owidth = iwidth - kwidth + 1;
        const oheight = iheight - kheight + 1;
        const odepth = kcount;
        const ocount = icount;

        /* Augment fragment shader */
        convolve_fs = "#version 300 es\n"
                      + "#define KU " + kwidth + ".0 \n"
                      + "#define KV " + kheight + ".0 \n"
                      + "#define KW " + kdepth + ".0 \n"
                      + "#define IW " + idepth + ".0 \n"
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
            depth: idepth*icount,
            minMag: gl.NEAREST,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: inputdata,
        });

        /* Kernel 3D texture  (A, B, Z*N) */
        const kerneldata = new Float32Array(kwidth*kheight*kdepth*kcount);
        kerneldata.fill(1.0/(kwidth*kheight));

        const kernel3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: kwidth,
            height: kheight,
            depth: kdepth*kcount,
            minMag: gl.NEAREST,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: kerneldata,
        });

        /* Target 3D texture  (X-A+1, Y-B+1, N) */
        const target3d = twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: iwidth-kwidth+1,
            height: iheight-kheight+1,
            depth: odepth*ocount,
            minMag: gl.NEAREST,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            data: null,
        });

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
            for(var ii=0; ii<icount; ii++){
                for(var d=0; d<kcount; d++)
                {
                    // select correct target texture z-slice
                    twgl.bindFramebufferInfo(gl, framebufferInfo2D);
                    gl.bindTexture(gl.TEXTURE_3D, target3d);
                    gl.framebufferTextureLayer(
                        gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, target3d, 0, ii*kcount+d);

                    var start = performance.now();
                    const uniforms = {
                        input3d: input3d,
                        kernel3d: kernel3d,
                        kernelindex: d,
                        inputindex: ii,
                    };
                    twgl.setUniforms(convolveProgram, uniforms);
                    twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLE_STRIP, 4);
                    var end = performance.now();
                    var duration = end - start;
                    console.log(duration);

                    /*
                    var framebufferDump2D = new Float32Array(owidth*oheight*4);
                    gl.readPixels(0, 0, owidth, oheight, gl.RGBA, gl.FLOAT, framebufferDump2D)
                    var framebufferDump = new Float32Array(
                        framebufferDump2D.filter(function (data, i) { return i % 4 == 0; }));
                    console.log(framebufferDump);

                    var myImageData = ctx.createImageData(owidth, oheight);
                    for(var i=0; i<framebufferDump.length; i++){
                        myImageData.data[i*4+0] = framebufferDump[i];
                        myImageData.data[i*4+1] = framebufferDump[i];
                        myImageData.data[i*4+2] = framebufferDump[i];
                        myImageData.data[i*4+3] = 255;
                    }
                    console.log(myImageData.data.length);
                    console.log(framebufferDump.length*4);
                    canvasbody.width = owidth;
                    canvasbody.height = oheight;
                    ctx.clearRect(0,0,owidth,oheight)
                    ctx.putImageData(myImageData, 0, 0);
                    */
                }
            }
        }

        function columnize(input_data, input_w, input_h, kernel_w) {
            var columnized = new Uint8Array(
                kernel_w * input_h * (input_w - kernel_w + 1) );
            var i = -1;
            for(var col=0; col<(input_w - kernel_w + 1); col++){
                for(var h=0; h<input_h; h++){
                    var off = col+h*input_w;
                    for(var k=0; k<kernel_w; k++){
                        columnized[++i] = input_data.data[off+k];
                    }
                }
            }
            return columnized;
        };

        var d, u, v, ku, kv, w;
        function im2col_convolve(){
            for(d=0; d<kcount; d++){
                for(u=0; u<owidth; u++){
                    for(v=0; v<oheight; v++){
                        for(ku=0; ku<kwidth; ku++){
                            for(kv=0; kv<kheight; kv++){
                                for(w=0; w<kdepth; w++){
                                }
                            }
                        }
                    }
                }
            }
        }

        glsl_convolve();

        const texProgram = twgl.createProgramInfo(gl, [tex_vs, tex_fs]);
        const texArrays = {
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
        const texBufferInfo = twgl.createBufferInfoFromArrays(gl, texArrays);
        const texFramebufferAttachments = [
            {
                internalFormat: gl.R32F,
                type: gl.FLOAT,
            },
        ];
        const texFramebufferInfo2D = twgl.createFramebufferInfo(
            gl, texFramebufferAttachments, owidth, oheight);
        gl.useProgram(texProgram.program);
        twgl.setBuffersAndAttributes(gl, texProgram, texBufferInfo);
        twgl.bindFramebufferInfo(gl, texFramebufferInfo2D);

        var d = 0;
        function drawloop(){
            stats.begin();

            const uniforms = {
                resolution: [owidth, oheight],
                tex: target3d,
                d: d,
            };
            twgl.setUniforms(texProgram, uniforms);
            twgl.drawBufferInfo(gl, texFramebufferInfo2D, gl.TRIANGLE_STRIP, 4);

            var framebufferDump2D = new Float32Array(owidth*oheight*4);
            gl.readPixels(0, 0, owidth, oheight, gl.RGBA, gl.FLOAT, framebufferDump2D)
            var framebufferDump = new Float32Array(
                framebufferDump2D.filter(function (data, i) { return i % 4 == 0; }));

            var myImageData = ctx.createImageData(owidth, oheight);
            for(var i=0; i<framebufferDump.length; i++){
                myImageData.data[i*4+0] = framebufferDump[i];
                myImageData.data[i*4+1] = framebufferDump[i];
                myImageData.data[i*4+2] = framebufferDump[i];
                myImageData.data[i*4+3] = 255;
            }
            canvasbody.width = owidth;
            canvasbody.height = oheight;
            ctx.clearRect(0,0,owidth,oheight)
            ctx.putImageData(myImageData, 0, 0);
            d = (d + 1) % (odepth * ocount);

            stats.end();

            requestAnimationFrame(drawloop);
        }

        requestAnimationFrame(drawloop);


        // var minny = 10000.0;
        // var maxy = 0.0;
        // var s = 0.0;
        // var loops = 10;
        // for(var x=0; x<loops; x++){
        //     var start = performance.now();
        //     glsl_convolve();
        //     var end = performance.now();
        //     var duration = end - start;
        //     if(duration < minny){
        //         minny = duration;
        //     } else if (duration > maxy){
        //         maxy = duration;
        //     }
        //     s += duration;
        // }
        // console.log("glsl:");
        // console.log(minny);
        // console.log(maxy);
        // console.log(s/loops);
        // var div = document.createElement('div');
        // div.innerHTML = minny + ' / ' + maxy + ' / ' + (s/loops);
        // document.body.append(div);
    }
);

