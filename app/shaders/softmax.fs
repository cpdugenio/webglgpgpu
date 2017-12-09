// Assume COUNT defined
uniform sampler3D input3d;

in vec2 f_uv;
out vec4 frag_color;

void main() {
    float num = exp(
            texelFetch(
                    input3d, ivec3(
                        0, 0, round(f_uv.y * COUNT) + round(f_uv.x)), 0).x);
    float denom = 0.0;
    for(float i=0.0; i<COUNT; i++){
        denom += exp(
                texelFetch(
                    input3d, ivec3(
                        0, 0, round(f_uv.y * COUNT) + round(i)), 0).x);
    }
    frag_color = vec4(num/denom, 0.0, 0.0, 0.0);
}

