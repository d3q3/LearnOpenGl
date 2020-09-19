/// <reference types="webgl2" />
import { Shader } from "../../../js/gl/shaders/Shader.js";
import { mat4 } from "../../../../math/glmatrix/index.js";
export declare class EnvShader extends Shader {
    glUniforms: Object;
    constructor(gl: any);
    init(gl: any): void;
    setMaterial(gl: WebGL2RenderingContext, glTexture: any): void;
    setProjection(projection: mat4): void;
    setView(view: mat4): void;
    private createGlUniforms;
}
