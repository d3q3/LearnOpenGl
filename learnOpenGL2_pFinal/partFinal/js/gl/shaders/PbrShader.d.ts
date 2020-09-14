/// <reference types="webgl2" />
import { Shader } from "../../../js/common/Shader.js";
import { Pbr0Material } from "../../../js/material/Material.js";
export declare class PbrShader extends Shader {
    glUniforms: Object;
    materialId: number;
    constructor(gl: any, vertexCode: any, fragmentCode: any, geometryCode?: any);
    setMaterial(gl: WebGL2RenderingContext, glMat: Pbr0Material, glTextures: WebGLTexture[]): void;
    private createGlUniforms;
}
