import { gl } from './globals';
import { vec3 } from "gl-matrix";
const Stats = require("stats-js");
import * as DAT from "dat.gui";
import Icosphere from "./geometry/Icosphere";
import Square from "./geometry/Square";
import Cube from "./geometry/Cube";
import OpenGLRenderer from "./rendering/gl/OpenGLRenderer";
import Camera from "./Camera";
import { setGL } from "./globals";
import ShaderProgram, { Shader } from "./rendering/gl/ShaderProgram";

// === UI Controls ===
const controls = {
  tesselations: 5,
  color_outer: [255, 61, 20],
  color_inner1: [241, 102, 0],
  color_inner2: [255, 200, 54],
  color_inner3: [0, 23, 255],
  octaves: 2,
  speed: 2.2,
  noiseSelection: "Worley",
  "Load Scene": loadScene,
};

const defaultControls = JSON.parse(JSON.stringify(controls));

// === Scene Objects ===
let icosphere: Icosphere, screenQuad: Square, cube: Cube;
let fireCore: Icosphere, fireCore2: Icosphere, fireCore3: Icosphere;
let prevTesselations: number = 5;

function loadScene() {
  icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, controls.tesselations); 
  icosphere.create();

  fireCore  = new Icosphere(vec3.fromValues(0, 0, 0), 0.7, controls.tesselations); 
  fireCore.create();

  fireCore2 = new Icosphere(vec3.fromValues(0, 0, 0), 0.5, controls.tesselations); 
  fireCore2.create();

  fireCore3 = new Icosphere(vec3.fromValues(0, 0, 0), 0.3, controls.tesselations); 
  fireCore3.create();
  
  cube  = new Cube(vec3.fromValues(0, 0, 0)); 
  cube.create();

  screenQuad = new Square(vec3.fromValues(0, 0, 0));
  screenQuad.create();
}

export function setupTexture(): WebGLTexture {
  const texture = gl.createTexture();
  const image = new Image();
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  };
  image.src = 'ice.png';
  return texture;
}

let mouseX = 0, mouseY = 0;
function main() {
  const stats = Stats();
  stats.setMode(0);
  document.body.appendChild(stats.domElement);

  const gui = new DAT.GUI();
  gui.add(controls, "tesselations", 0, 8, 1);
  gui.add(controls, "octaves", 1, 4, 1);
  gui.add(controls, "speed", 0.5, 4, 0.1);
  gui.addColor(controls, "color_outer");
  gui.addColor(controls, "color_inner1");
  gui.addColor(controls, "color_inner2");
  gui.addColor(controls, "color_inner3");
  gui.add({ reset: () => Object.assign(controls, defaultControls) && gui.updateDisplay() }, "reset").name("Reset to Defaults");

  const canvas = <HTMLCanvasElement>document.getElementById("canvas");
  const gl = <WebGL2RenderingContext>canvas.getContext("webgl2");
  if (!gl) alert("WebGL 2 not supported!");
  setGL(gl);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const texture = setupTexture();
  canvas.addEventListener("mousemove", (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
  });

  loadScene();
  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));
  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  gl.enable(gl.DEPTH_TEST);

  const fire = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/fire-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/fire-frag.glsl")),
  ]);

  const firecore = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/fire-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/fire-core-frag.glsl")),
  ]);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/lambert-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/lambert-frag.glsl")),
  ]);

  const snowShader = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require("./shaders/snow-vert.glsl")),
    new Shader(gl.FRAGMENT_SHADER, require("./shaders/snow-frag.glsl")),
  ]);

  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();


    const convertColor = (c: number[]) => c.map(x => x / 255.0).concat([1]);
    const outer = convertColor(controls.color_outer);
    const inner1 = convertColor(controls.color_inner1);
    const inner2 = convertColor(controls.color_inner2);
    const inner3 = convertColor(controls.color_inner3);

    gl.disable(gl.DEPTH_TEST);
    snowShader.use();
    snowShader.setUniform1f("u_Time", performance.now() * 0.001);
    snowShader.setUniform2f("u_Resolution", window.innerWidth, window.innerHeight);
    renderer.render(camera, snowShader, [screenQuad]);


    lambert.use();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    lambert.setUniform1i("u_Texture", 0);

    gl.disable(gl.CULL_FACE);
    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);
    renderer.render(camera, lambert, [cube]);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.FRONT);
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);

    renderer.render(camera, fire, [icosphere], outer, [mouseX, mouseY], controls.octaves, controls.speed);
    renderer.render(camera, firecore, [fireCore], inner1, [mouseX, mouseY], controls.octaves, controls.speed);
    renderer.render(camera, firecore, [fireCore2], inner2, [0, 0], controls.octaves, controls.speed);
    renderer.render(camera, firecore, [fireCore3], inner3, [0, 0], controls.octaves, controls.speed);

    gl.depthMask(true);
    gl.enable(gl.DEPTH_TEST);

    stats.end();
    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  });

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  tick();
}

main();
