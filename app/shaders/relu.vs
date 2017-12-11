#version 300 es
in vec4 position;

/* Pass through */
in vec2 uv;
out vec2 f_uv;

void main() {
    gl_Position = position;
    f_uv = uv;
}
