import { PbrShader } from "../../../js/gl/shaders/PbrShader.js";
export class Shaders {
    constructor(gl) {
        this.gl = gl;
        this.shaders = {};
    }
    getShader(type) {
        if (this.shaders[type] == undefined)
            this.shaders[type] = new PbrShader(this.gl);
        return this.shaders[type];
    }
}
//# sourceMappingURL=Shaders.js.map