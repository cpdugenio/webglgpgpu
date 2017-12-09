// Assume SIZE, STRIDE defined
uniform sampler3D input3d;
uniform float inputindex;

in vec2 f_uv;
out vec4 frag_color;

void main() {
    float maxval = 0.0;
    float val = 0.0;
    for(float x=0.0; x<SIZE; x++){
        for(float y=0.0; y<SIZE; y++){
            val = texelFetch(
                input3d, ivec3(
                    round(f_uv.x*STRIDE + x),
                    round(f_uv.y*STRIDE + y),
                    inputindex), 0).x;
            if(val > maxval){
                maxval = val;
            }
        }
    }
    frag_color = vec4(maxval, 0.0, 0.0, 0.0);
}

