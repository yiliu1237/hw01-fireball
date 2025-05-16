#version 300 es
precision highp float;

// Inputs from the vertex shader
in vec3 fs_Nor;
in vec3 fs_LightVec;
in vec2 fs_UV;

// Uniforms
uniform sampler2D u_Texture;  // The texture sampler
uniform vec4 u_Color;         // Base color (used if no texture)

// Output
out vec4 out_Col;

void main() {
  // Normalize interpolated normal and light direction
  vec3 N = normalize(fs_Nor);
  vec3 L = normalize(fs_LightVec);

  // Lambertian diffuse term
  float diffuse = max(dot(N, L), 0.0);

  // Sample texture (optional)
  vec4 texColor = texture(u_Texture, fs_UV);


  vec3 base = texColor.rgb;  // Use texture directly
  vec3 finalColor = base;  // Ambient te

  out_Col = vec4(finalColor, 1.0);
}
