#version 300 es
precision highp float;
// ---------------------------------------------
// ref: https://www.shadertoy.com/view/4lfcz4
// ---------------------------------------------

uniform float u_Time;
uniform vec2 u_Resolution;
uniform vec2 u_Mouse;

in vec2 v_UV;
out vec4 out_Col;

#define LAYERS 66
#define DEPTH1 0.3
#define WIDTH1 0.4
#define SPEED1 0.6
#define DEPTH2 0.1
#define WIDTH2 0.3
#define SPEED2 0.1

float snow(vec2 uv) {
  const mat3 permute = mat3(
    13.323122, 23.5112, 21.71123,
    21.1212,  28.7312, 11.9312,
    21.8112,  14.7212, 61.3934
  );

  vec2 mouse = u_Mouse / u_Resolution;
  uv.x += mouse.x * 4.0;
  mouse.y *= 0.25;

  float depth = mix(DEPTH1, DEPTH2, mouse.y);
  float width = mix(WIDTH1, WIDTH2, mouse.y);
  float speed = mix(SPEED1, SPEED2, mouse.y);

  float accumulation = 0.0;
  float dof = 5.0 * sin(u_Time * 0.1);

  for (int i = 0; i < LAYERS; ++i) {
    float fi = float(i);
    vec2 q = uv * (1.0 + fi * depth);
    float w = width * mod(fi * 7.238917, 1.0) - width * 0.1 * sin(u_Time * 2.0 + fi);
    q += vec2(q.y * w, speed * u_Time / (1.0 + fi * depth * 0.03));

    vec3 n = vec3(floor(q), 31.189 + fi);
    vec3 m = floor(n) * 0.00001 + fract(n);
    vec3 mp = (31415.9 + m) / fract(permute * m);
    vec3 r = fract(mp);

    vec2 s = abs(mod(q, 1.0) - 0.5 + 0.9 * r.xy - 0.45);
    s += 0.01 * abs(2.0 * fract(10.0 * q.yx) - 1.0);

    float d = 0.6 * max(s.x - s.y, s.x + s.y) + max(s.x, s.y) - 0.01;
    float edge = 0.05 + 0.05 * min(0.5 * abs(fi - 5.0 - dof), 1.0);
    accumulation += smoothstep(edge, -edge, d) * (r.x / (1.0 + 0.02 * fi * depth));
  }

  return accumulation;
}

void main() {
  vec2 uv = v_UV * vec2(u_Resolution.x / u_Resolution.y, 1.0);
  float snowVal = snow(uv);
  out_Col = vec4(vec3(snowVal), snowVal);
}
