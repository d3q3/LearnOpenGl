import { PbrShader } from "../../../js/gl/shaders/Pbr0Shader.js";
import { EnvShader } from "../../../js/gl/shaders/Env0Shader.js";
export class Shaders {
    constructor(gl) {
        this.gl = gl;
        this.shaders = {};
    }
    getShader(type) {
        if (this.shaders[type] == undefined) {
            if (type == "pbr0")
                this.shaders[type] = new PbrShader(this.gl);
            if (type == "env0")
                this.shaders[type] = new EnvShader(this.gl);
        }
        return this.shaders[type];
    }
}
//# sourceMappingURL=Shaders.js.map