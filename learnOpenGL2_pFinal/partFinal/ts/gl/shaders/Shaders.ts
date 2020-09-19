import { Shader } from "../../../js/gl/shaders/Shader.js";
import { PbrShader } from "../../../js/gl/shaders/Pbr0Shader.js";
import { EnvShader } from "../../../js/gl/shaders/Env0Shader.js";



export class Shaders {
    gl: WebGL2RenderingContext;
    shaders: any;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.shaders = {};
    }

    getShader(type: string): Shader {
        if (this.shaders[type] == undefined) {
            if (type == "pbr0") this.shaders[type] = new PbrShader(this.gl);
            if (type == "env0") this.shaders[type] = new EnvShader(this.gl);
        }
        return this.shaders[type];
    }
}