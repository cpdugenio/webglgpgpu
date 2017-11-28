#version 300 es
precision highp float;
precision highp sampler3D;
uniform vec2 resolution;
uniform sampler3D tex;
uniform int d;
in vec2 f_uv;
out vec4 frag_color;
void main() {
    vec4 texpix = texelFetch(tex,
            ivec3(round(f_uv.y), round(f_uv.x), d), 0);
    frag_color = texpix;
}
