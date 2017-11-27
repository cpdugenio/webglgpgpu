// Assume KU, KV, KW (floats) defined
uniform sampler3D input3d;
uniform sampler3D kernel3d;
uniform float kernelindex;

in vec2 f_uv;
out vec4 frag_color;

void main() {
    vec4 color = vec4(0.0);
    for(float x=0.0; x<KU; x++){
        for(float y=0.0; y<KV; y++){
            for(float z=0.0; z<KW; z++){
                /*
                ivec4 sk = ivec4(y, x, z+kernelindex*KW, 0);
                ivec3 si = ivec3(round(f_uv.yx), z) + sk.xyw;
                vec4 ifetch = texelFetch(input3d, si, 0);
                vec4 kfetch = texelFetch(kernel3d, sk.xyz, 0);
                color += ifetch * kfetch;
                */
                color +=
                    texelFetch(input3d, ivec3(round(f_uv.y + y), round(f_uv.x + x), z), 0) *
                    texelFetch(kernel3d, ivec3(y, x, z+kernelindex*KW), 0);
            }
        }
    }
    frag_color = color;
}

