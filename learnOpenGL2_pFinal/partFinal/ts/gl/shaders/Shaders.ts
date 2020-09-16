import { Shader } from "../../../js/gl/shaders/Shader.js";
import { PbrShader } from "../../../js/gl/shaders/PbrShader.js";

import { Material } from "../../../js/material/Material.js";


export class Shaders {
    gl: WebGL2RenderingContext;
    shaders: any;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.shaders = {};
    }

    getShader(type: string): Shader {
        if (this.shaders[type] == undefined) this.shaders[type] = new PbrShader(this.gl);
        return this.shaders[type];
    }
}