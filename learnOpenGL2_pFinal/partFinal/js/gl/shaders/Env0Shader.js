import { Shader } from "../../../js/gl/shaders/Shader.js";
import { vs_env, fs_env } from "../../../js/gl/shaders/env0/index.js";
export class EnvShader extends Shader {
    constructor(gl) {
        super(gl, vs_env, fs_env);
        this.init(gl);
        this.createGlUniforms(gl);
    }
    init(gl) {
        this.use();
        this.setInt(gl, "cubemap", 0);
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
        this.gl.uniformMatrix4fv(this.glUniforms["view"], false, view);
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