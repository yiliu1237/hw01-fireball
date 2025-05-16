import { vec3, vec4 } from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import { gl } from '../globals';

class Icosphere extends Drawable {
  buffer: ArrayBuffer;
  indices: Uint32Array;
  positions: Float32Array;
  normals: Float32Array;
  center: vec4;

  constructor(center: vec3, public radius: number, public subdivisions: number) {
    super();
    this.center = vec4.fromValues(center[0], center[1], center[2], 1);
  }

  create() {
    const X = 0.6;
    const Z = 0.9;

    const maxTriangleCount = 80 * Math.pow(4, this.subdivisions);
    const maxVertexCount = 42 * Math.pow(4, this.subdivisions);

    const indexOffset = 0;
    const vertexOffset = maxTriangleCount * 3 * Uint32Array.BYTES_PER_ELEMENT;
    const normalOffset = vertexOffset;
    const positionOffset = vertexOffset + maxVertexCount * 4 * Float32Array.BYTES_PER_ELEMENT;

    const dataBuffer = new ArrayBuffer(positionOffset + maxVertexCount * 4 * Float32Array.BYTES_PER_ELEMENT);
    const indexBuffer = new ArrayBuffer(maxTriangleCount * 3 * Uint32Array.BYTES_PER_ELEMENT);
    const buffers = [dataBuffer, indexBuffer];

    let activeBuffer = 0;

    // === Initialize Base Geometry ===
    let triangles: Array<Uint32Array> = new Array(20);
    for (let i = 0; i < 20; ++i) {
      triangles[i] = new Uint32Array(buffers[activeBuffer], indexOffset + i * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
    }

    let vertexList: Array<Float32Array> = new Array(12);
    for (let i = 0; i < 12; ++i) {
      vertexList[i] = new Float32Array(dataBuffer, vertexOffset + i * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
    }

    const baseVertices = [
      [-X, 0, Z], [X, 0, Z], [-X, 0, -Z], [X, 0, -Z],
      [0, Z, X], [0, Z, -X], [0, -Z, X], [0, -Z, -X],
      [Z, X, 0], [-Z, X, 0], [Z, -X, 0], [-Z, -X, 0]
    ];

    baseVertices.forEach((v, i) => {
      let distortion = 1.0 + (Math.random() - 0.5) * 0.06;
      let yBias = 1.0 + (v[1] > 0 ? 0.03 : -0.03);
      vertexList[i].set([v[0] * distortion, v[1] * yBias * distortion, v[2] * distortion, 0]);
      vec4.normalize(vertexList[i], vertexList[i]);
    });

    const baseIndices = [
      [0, 4, 1], [0, 9, 4], [9, 5, 4], [4, 5, 8], [4, 8, 1],
      [8, 10, 1], [8, 3, 10], [5, 3, 8], [5, 2, 3], [2, 7, 3],
      [7, 10, 3], [7, 6, 10], [7, 11, 6], [11, 0, 6], [0, 1, 6],
      [6, 1, 10], [9, 0, 11], [9, 11, 2], [9, 2, 5], [7, 2, 11]
    ];
    baseIndices.forEach((tri, i) => triangles[i].set(tri));

    let refinedTriangles: Array<Uint32Array> = [];

    // === Subdivide ===
    for (let s = 0; s < this.subdivisions; ++s) {
      activeBuffer = 1 - activeBuffer;
      refinedTriangles.length = triangles.length * 4;
      let triangleCounter = 0;
      const midpointCache: Map<string, number> = new Map();

      const getMidpointIndex = (v0: number, v1: number): number => {
        const key = [v0, v1].sort().join('_');
        if (!midpointCache.has(key)) {
          const midpoint = new Float32Array(dataBuffer, vertexOffset + vertexList.length * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
          vec4.add(midpoint, vertexList[v0], vertexList[v1]);
          vec4.normalize(midpoint, midpoint);

          const wobble = 1.0 + (Math.random() - 0.5) * 0.04;
          midpoint[0] *= wobble;
          midpoint[1] *= wobble;
          midpoint[2] *= wobble;

          midpointCache.set(key, vertexList.length);
          vertexList.push(midpoint);
        }
        return midpointCache.get(key)!;
      };

      for (let t = 0; t < triangles.length; ++t) {
        const [v0, v1, v2] = triangles[t];
        const v3 = getMidpointIndex(v0, v1);
        const v4 = getMidpointIndex(v1, v2);
        const v5 = getMidpointIndex(v2, v0);

        const t0 = refinedTriangles[triangleCounter++] = new Uint32Array(buffers[activeBuffer], indexOffset + triangleCounter * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
        const t1 = refinedTriangles[triangleCounter++] = new Uint32Array(buffers[activeBuffer], indexOffset + triangleCounter * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
        const t2 = refinedTriangles[triangleCounter++] = new Uint32Array(buffers[activeBuffer], indexOffset + triangleCounter * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);
        const t3 = refinedTriangles[triangleCounter++] = new Uint32Array(buffers[activeBuffer], indexOffset + triangleCounter * 3 * Uint32Array.BYTES_PER_ELEMENT, 3);

        t0.set([v0, v3, v5]);
        t1.set([v3, v4, v5]);
        t2.set([v3, v1, v4]);
        t3.set([v5, v4, v2]);
      }

      const temp = triangles;
      triangles = refinedTriangles;
      refinedTriangles = temp;
    }

    // === Final Assembly ===
    if (activeBuffer === 1) {
      const copyTo0 = new Uint32Array(dataBuffer, 0, 3 * triangles.length);
      const from1 = new Uint32Array(indexBuffer, 0, 3 * triangles.length);
      copyTo0.set(from1);
    }

    for (let i = 0; i < vertexList.length; ++i) {
      const pos = new Float32Array(dataBuffer, positionOffset + i * 4 * Float32Array.BYTES_PER_ELEMENT, 4);
      vec4.scaleAndAdd(pos, this.center, vertexList[i], this.radius);
    }

    this.buffer = dataBuffer;
    this.indices = new Uint32Array(this.buffer, indexOffset, triangles.length * 3);
    this.normals = new Float32Array(this.buffer, normalOffset, vertexList.length * 4);
    this.positions = new Float32Array(this.buffer, positionOffset, vertexList.length * 4);

    this.generateIdx();
    this.generatePos();
    this.generateNor();

    this.count = this.indices.length;

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
    gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
    gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
  }
};

export default Icosphere;
