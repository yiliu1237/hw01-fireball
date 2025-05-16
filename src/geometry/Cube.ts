import {vec3, vec4} from 'gl-matrix';
import Drawable from '../rendering/gl/Drawable';
import {gl} from '../globals';

class Cube extends Drawable {
    indices: Uint32Array;
    positions: Float32Array;
    normals: Float32Array;
    uvs: Float32Array;
    center: vec4;

    constructor(center: vec3) {
        super(); // Call the constructor of the super class. This is required.
        this.center = vec4.fromValues(center[0], center[1], center[2], 1);
    }

    create() {
        // this.indices = new Uint32Array([
        //     0, 1, 2,                        
        //     0, 2, 3,
        //     4, 5, 6, 
        //     4, 6, 7, 
        //     8, 9, 10, 
        //     8, 10, 11,
        //     12, 13, 14, 
        //     12, 14, 15, 
        //     16, 17, 18, 
        //     16, 18, 19, 
        //     20, 21, 22, 
        //     20, 22, 23]);
        this.indices = new Uint32Array([
            2, 1, 0,
            3, 2, 0,
            6, 5, 4,
            7, 6, 4,
            10, 9, 8,
            11, 10, 8,
            14, 13, 12,
            15, 14, 12,
            18, 17, 16,
            19, 18, 16,
            22, 21, 20,
            23, 22, 20
          ]);



        this.positions = new Float32Array([
            //front face, [0, 3]
            -1, -1, 1, 1,
            1, -1, 1, 1,
            1, 1, 1, 1,
            -1, 1, 1, 1,
            //right face [4, 7]
            1, -1, 1, 1,
            1, -1, -1, 1,
            1, 1, -1, 1,
            1, 1, 1, 1,
            //back face [8, 11]
            1, -1, -1, 1,
            -1, -1, -1, 1,
            -1, 1, -1, 1,
            1, 1, -1, 1,
            //left face [12, 15]
            -1, -1, -1, 1,
            -1, -1, 1, 1,
            -1, 1, 1, 1,
            -1, 1, -1, 1,
            //up face [16, 19]
            -1, 1, 1, 1,
            1, 1, 1, 1,
            1, 1, -1, 1,
            -1, 1, -1, 1,
            //down face [20, 23]
            1, -1, 1, 1,
            -1, -1, 1, 1,
            -1, -1, -1, 1,
            1, -1, -1, 1]);

        this.normals = new Float32Array([
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,
            0, 0, 1, 0,

            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,
            1, 0, 0, 0,

            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,
            0, 0, -1, 0,

            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,
            -1, 0, 0, 0,

            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,
            0, 1, 0, 0,

            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0,
            0, -1, 0, 0
        ]);

        this.uvs = new Float32Array([
            // front face
            0, 0, 1, 0, 1, 1, 0, 1,
            // back face
            1, 0, 0, 0, 0, 1, 1, 1,
            // top face
            0, 1, 1, 1, 1, 0, 0, 0,
            // bottom face
            0, 0, 0, 1, 1, 1, 1, 0,
            // right face
            0, 0, 1, 0, 1, 1, 0, 1,
            // left face
            1, 0, 0, 0, 0, 1, 1, 1,
        ]);
          
          

        this.generateIdx();
        this.generatePos();
        this.generateNor();
        this.generateUV(); 


        for (let i = 0; i < this.positions.length; i += 4) {
            this.positions[i] *= 40;     // x
            this.positions[i + 1] *= 40; // y
            this.positions[i + 2] *= 40; // z
            // this.positions[i + 3] stays 1 (homogeneous coord)
          }


        
          for (let i = 0; i < this.normals.length; i += 4) {
            this.normals[i] *= -1;    
            this.normals[i + 1] *= -1; 
            this.normals[i + 2] *= -1; 
          }
    
    
        this.count = this.indices.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufIdx);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.indices, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufNor);
        gl.bufferData(gl.ARRAY_BUFFER, this.normals, gl.STATIC_DRAW);
    
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufPos);
        gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufUV);
        gl.bufferData(gl.ARRAY_BUFFER, this.uvs, gl.STATIC_DRAW);
    
        console.log(`Created cube`);
    }
};

export default Cube;