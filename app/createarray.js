define(function(){
    return function create_array(gl, WHDN, data){
        var textures = [];
        var stride = WHDN.w*WHDN.h*WHDN.d;
        var subarray = null;
        for(var i=0; i<WHDN.n; i++){
            if(data != null){
                subarray = data.subarray(i*stride, (i+1)*stride);
            }
            textures.push(
                twgl.createTexture(gl, {
                    target: gl.TEXTURE_3D,
                    width: WHDN.w,
                    height: WHDN.h,
                    depth: WHDN.d,
                    minMag: gl.NEAREST,
                    internalFormat: gl.R32F,
                    type: gl.FLOAT,
                    src: subarray,
                })
            );
        }

        return {
            w: WHDN.w,
            h: WHDN.h,
            d: WHDN.d,
            n: WHDN.n,
            t: textures,
        };
    }
});
