#version 300 es
precision mediump int;

// === UNIFORMS ===
uniform mat4 u_Model;
uniform mat4 u_ModelInvTr;
uniform mat4 u_ViewProj;

uniform float u_Time;      // Time in seconds
uniform float u_Speed;
uniform int u_Octaves;

uniform vec2 u_Resolution;
uniform vec2 u_Mouse;

// === INPUTS (from CPU side) ===
in vec4 vs_Pos;
in vec4 vs_Nor;
in vec4 vs_Col;

// === OUTPUTS (to fragment shader) ===
out vec4 fs_Nor;
out vec4 fs_LightVec;
out vec4 fs_Col;
out vec3 fs_world;
out vec4 fs_Up;

// === CONSTANTS ===
const vec4 lightPos = vec4(5.0, 5.0, 3.0, 1.0);
#define MOD3 vec3(443.8975, 397.2973, 491.1871)


// === UTILITY FUNCTIONS ===

float randomHash2D(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float calculateWaveDisplacement(vec2 pos, float amp, vec2 vel, float freq) {
    vec2 wave = vec2(
        amp * sin(pos.x * freq + u_Time * u_Speed * vel.x),
        amp * sin(pos.y * freq + u_Time * u_Speed * vel.y)
    );
    return length(wave);
}

float computeFlameDisplacement(vec3 pos) {
    float wave = 0.0;
    for (int i = 1; i <= u_Octaves; i++) {
        vec2 hashOffset = vec2(float(i) * 4832.11);
        vec2 wavedir = normalize(vec2(
            randomHash2D(hashOffset),
            randomHash2D(hashOffset + 331.11)
        ));
        float freq = 2.5 * pow(2.0, float(i));
        float amp = 1.2 * pow(0.5, float(i));
        wave += calculateWaveDisplacement(pos.xz + randomHash2D(hashOffset), amp, 2.0 * wavedir, freq);
    }
    return wave;
}

float biasCurve(float t, float b) {
    return t / ((((1.0 / b) - 2.0) * (1.0 - t)) + 1.0);
}


// === MAIN ===

void main() {
    fs_Col = vs_Col;

    // === Transform Normal ===
    mat3 invTranspose = mat3(u_ModelInvTr);
    fs_Nor = vec4(invTranspose * vec3(vs_Nor), 0.0);

    // === Transform Position to World Space ===
    vec4 modelPos = u_Model * vs_Pos;
    fs_world = modelPos.xyz;

    // === Compute Vertical Offset ===
    float attenuation = clamp(dot(fs_Nor, vec4(0.0, 1.0, 0.0, 0.0)), 0.0, 1.0);
    attenuation = biasCurve(attenuation, 0.35);
    float offset = computeFlameDisplacement(modelPos.xyz) * attenuation;
    modelPos.y += offset;

    // === Compute Light Vector ===
    fs_LightVec = lightPos - modelPos;

    // === Project to Clip Space ===
    gl_Position = u_ViewProj * modelPos;

    // === Mouse Interaction ===
    vec2 mouse = u_Mouse / u_Resolution;
    mouse.y = 1.0 - mouse.y;   // Flip Y (WebGL vs screen coords)
    mouse = mouse * 2.0 - 1.0;   // // Convert to [-1, 1] NDC space

    float d = distance(mouse, gl_Position.xy / gl_Position.w);
    //float dist = exp(-10.0 * d * d); 
    // fade from 0.25 -> 0.0 (When d = 0.0: dist = 1.0 (max effect at the mouse center); When d = 0.25 : dist = 0.0 (no effect past this radius))
    float dist = smoothstep(0.25, 0.0, d); 
    dist *= 1.0;

    vec3 mouseDir = normalize(vec3(mouse - (gl_Position.xy / gl_Position.w), 0.0));
    gl_Position.xy += mouse.xy * dist;

    // === Up Vector in View Space ===
    fs_Up = u_ViewProj * vec4(0.0, 1.0, 0.0, 0.0);
}
