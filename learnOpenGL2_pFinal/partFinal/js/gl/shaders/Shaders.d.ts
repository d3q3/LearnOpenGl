/// <reference types="webgl2" />
import { Shader } from "../../../js/gl/shaders/Shader.js";
export declare class Shaders {
    gl: WebGL2RenderingContext;
    shaders: any;
    constructor(gl: WebGL2RenderingContext);
    getShader(type: string): Shader;
}
