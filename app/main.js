require.config({
    baseUrl: "/app",
    paths: {
        // Note that text.js is symlinked in /app to make text! easier
    },
});

require(
    ["text"],
    function(text){
        // inject stats
        var stats;
        stats =  new Stats();
        stats.showPanel( 1 ); // 0: fps, 1: ms, 2: mb, 3+: custom
        document.body.appendChild( stats.dom );

        const gl = document.getElementById("glcanvas").getContext("webgl2");
        const programInfo = twgl.createProgramInfo(gl, ["vs", "fs"]);

        const arrays = {
            position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
        };
        const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);

        function render(time) {
            stats.begin();
            twgl.resizeCanvasToDisplaySize(gl.canvas);
            gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

            const uniforms = {
                time: time * 0.001,
                resolution: [gl.canvas.width, gl.canvas.height],
            };

            gl.useProgram(programInfo.program);
            twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
            twgl.setUniforms(programInfo, uniforms);
            twgl.drawBufferInfo(gl, bufferInfo);
            stats.end();

            requestAnimationFrame(render);
        }
        requestAnimationFrame(render);
    }
);
