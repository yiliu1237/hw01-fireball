#version 300 es
precision mediump int;
precision highp float;

// === Uniforms ===
uniform vec4 u_Color;
uniform float u_Time;
uniform float u_Speed;
uniform int u_Octaves;
uniform vec3 u_Camera;
uniform vec2 u_Resolution;

// === Inputs from Vertex Shader ===
in vec4 fs_Nor;
in vec4 fs_LightVec;
in vec3 fs_world;
in vec4 fs_Up;

// === Output ===
out vec4 out_Col;

// === Constants ===
#define MOD3 vec3(443.8975, 397.2973, 491.1871)
const float PI = 3.14159265359;

// === Utility Functions ===
float randomHash2D(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * MOD3);
    p3 += dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
}

float biasCurve(float t, float b) {
    return t / ((((1.0 / b) - 2.0) * (1.0 - t)) + 1.0);
}

float calculateWaveDisplacement(vec2 pos, float amp, vec2 dir, float freq) {
    vec2 wave = vec2(
        amp * sin(pos.x * freq + u_Time * u_Speed * dir.x),
        amp * sin(pos.y * freq + u_Time * u_Speed * dir.y)
    );
    return length(wave);
}

float computeFlameDisplacement(vec3 pos) {
    float wave = 0.0;
    for (int i = 1; i <= u_Octaves; ++i) {
        vec2 dir = normalize(vec2(
            randomHash2D(vec2(float(i) * 4832.11)),
            randomHash2D(vec2(float(i) * 331.11))
        ));
        float freq = 2.5 * pow(2.0, float(i));
        float amp = 1.2 * pow(0.5, float(i));
        wave += calculateWaveDisplacement(pos.xz + randomHash2D(vec2(float(i) * 4832.11)), amp, 2.0 * dir, freq);
    }
    return wave;
}

// === Main Shader ===
void main() {
    vec2 up = normalize(vec2(fs_Up.xy));
    vec3 world = normalize(fs_world);

    float atten = clamp(dot(fs_Nor, vec4(0, 1.0, 0, 0)), 0.0, 1.0);
    float offset = computeFlameDisplacement(world) * biasCurve(atten, 0.15);
    world.y += offset;

    vec3 dx = dFdx(world);
    vec3 dy = dFdy(world);
    vec3 normal = normalize(cross(dx, dy));
    vec3 viewDir = normalize(u_Camera - fs_world);
    vec3 lightDir = normalize(fs_LightVec.xyz);

    // Basic lighting
    float diffuse = max(dot(normal, lightDir), 0.0);
    vec3 baseColor = u_Color.rgb;
    vec3 color = baseColor * diffuse + 0.2 * baseColor;

    float rim = 1.0 - max(dot(viewDir, normal), 0.0);
    rim = pow(rim, 4.0);
    color += rim * vec3(1.0, 0.5, 0.0);

    // Flickering effect
    float flicker = sin(u_Time * 10.0 + fs_world.y * 5.0) * 0.1;
    color *= 0.9 + flicker;

    // Alpha fade by height and edge
    float heightFade = clamp((fs_world.y + 1.0) / 2.0, 0.0, 1.0);
    float heightAlpha = 1.0 - heightFade;
    float rimEdge = 1.0 - dot(viewDir, normalize(fs_Nor.xyz));
    float rimFade = pow(clamp(rimEdge, 0.0, 1.0), 2.5);
    float alpha = pow(1.0 - heightFade, 2.0);

    out_Col = vec4(color, alpha);
}
