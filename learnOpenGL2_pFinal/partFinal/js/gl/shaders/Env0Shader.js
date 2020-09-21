import { Shader } from "../../../js/gl/shaders/Shader.js";
import { mat4 } from "../../../../math/glmatrix/index.js";
import { vs_env, fs_env } from "../../../js/gl/shaders/env0/index.js";
export class EnvShader extends Shader {
    constructor(gl) {
        super(gl, vs_env, fs_env);
        this.isCentered = true;
        this.init(gl);
        this.createGlUniforms(gl);
    }
    init(gl) {
        this.use();
        this.setInt(gl, "cubemap", 0);
    }
    center(isCentered) {
        this.isCentered = isCentered;
    }
    setMaterial(gl, glTexture) {
        var us = this.glUniforms;
        this.init(gl);
        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
    }
    setProjection(projection) {
        this.gl.uniformMatrix4fv(this.glUniforms["projection"], false, projection);
    }
    setView(view) {
        let centeredView4 = mat4.clone(view);
        if (this.isCentered) {
            centeredView4[12] = 0.0;
            centeredView4[13] = 0.0;
            centeredView4[14] = 0.0;
        }
        this.gl.uniformMatrix4fv(this.glUniforms["view"], false, centeredView4);
    }
    createGlUniforms(gl) {
        this.glUniforms = new Object();
        var us = this.glUniforms;
        var program = this.programId;
        this.use();
        us["projection"] = gl.getUniformLocation(program, 'projection');
        us["view"] = gl.getUniformLocation(program, 'view');
    }
}
//# sourceMappingURL=Env0Shader.js.map