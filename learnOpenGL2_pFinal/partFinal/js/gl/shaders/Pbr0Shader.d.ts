/// <reference types="webgl2" />
import { Shader } from "../../../js/gl/shaders/Shader.js";
import { vec3, mat4 } from "../../../../math/glmatrix/index.js";
import { Pbr0Material } from "../../../js/material/Material.js";
export declare class PbrShader extends Shader {
    glUniforms: Object;
    materialId: number;
    constructor(gl: any);
    private init;
    setMaterial(gl: WebGL2RenderingContext, glMat: Pbr0Material, glTextures: WebGLTexture[]): void;
    setLights(lightPositions: Float32Array, lightColors: Float32Array): void;
    setCameraPosition(position: vec3): void;
    setProjection(projection: mat4): void;
    setView(view: mat4): void;
    setModel(model: mat4): void;
    private createGlUniforms;
}
