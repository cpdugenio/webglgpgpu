#version 300 es
precision highp float;
precision highp sampler3D;
uniform sampler3D input3d;
uniform float inputindex;

in vec2 f_uv;
out vec4 frag_color;

void main() {
    float val = texelFetch(
        input3d, ivec3(
            round(f_uv.x),
            round(f_uv.y),
            inputindex), 0).x;
    frag_color = vec4(max(0.0, val), 0.0, 0.0, 0.0);
}

