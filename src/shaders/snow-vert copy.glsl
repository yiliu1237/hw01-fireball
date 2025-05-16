#version 300 es
precision highp float;

in vec4 vs_Pos;
out vec2 v_UV;

void main() {
  v_UV = vs_Pos.xy * 0.5 + 0.5;  // Convert from NDC [-1,1] to [0,1] UV space
  gl_Position = vs_Pos;
}