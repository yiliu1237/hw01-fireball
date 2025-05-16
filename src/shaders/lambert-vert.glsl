#version 300 es
precision highp float;

in vec3 vs_Pos;
in vec3 vs_Nor;
in vec2 vs_UV;

out vec3 fs_Nor;
out vec3 fs_LightVec;
out vec2 fs_UV;

uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;

// Light position in world space
const vec3 lightPos = vec3(5.0, 5.0, 5.0);

void main() {
  vec4 modelPos = u_Model * vec4(vs_Pos, 1.0);
  vec3 modelNor = mat3(u_ModelInvTr) * vs_Nor;

  fs_Nor = modelNor;
  fs_LightVec = lightPos - modelPos.xyz;
  fs_UV = vs_UV;

  gl_Position = u_ViewProj * modelPos;
}
