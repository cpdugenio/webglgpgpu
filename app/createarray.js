define(function(){
    return function create_array(gl, WHDN, data){
        return twgl.createTexture(gl, {
            target: gl.TEXTURE_3D,
            width: WHDN.w,
            height: WHDN.h,
            depth: WHDN.d*WHDN.n,
            minMag: gl.NEAREST,
            internalFormat: gl.R32F,
            type: gl.FLOAT,
            src: data,
        });
    }
});
