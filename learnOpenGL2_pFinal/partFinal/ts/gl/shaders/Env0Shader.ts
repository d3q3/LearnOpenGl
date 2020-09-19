import { Shader } from "../../../js/gl/shaders/Shader.js";
import { vec3, mat4 } from "../../../../math/glmatrix/index.js";
import { vs_env, fs_env } from "../../../js/gl/shaders/env0/index.js";

export class EnvShader extends Shader {
    glUniforms: Object;

    /**
     * D3Q: Use the Shaders-collection to create a Env0Shader
     * @param gl 
     */
    constructor(gl) {
        super(gl, vs_env, fs_env);

        this.init(gl);
        this.createGlUniforms(gl);
    }

    init(gl) {
        this.use();
        this.setInt(gl, "cubemap", 0);
    }

    /**
     * D3Q: There is not a real material in this case; the textures unit is
     * set and the texture used is a Cube_Map texture.
     * @param gl 
     * @param glTexture 
     */
    setMaterial(gl: WebGL2RenderingContext, glTexture) {

        var us = this.glUniforms;

        this.init(gl);

        gl.activeTexture(gl.TEXTURE0 + 0);
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, glTexture);
    }

    setProjection(projection: mat4) {
        this.gl.uniformMatrix4fv(this.glUniforms["projection"], false, projection);
    }
    setView(view: mat4) {
        this.gl.uniformMatrix4fv(this.glUniforms["view"], false, view);
    }

    private createGlUniforms(gl) {
        this.glUniforms = new Object();
        var us = this.glUniforms;
        var program = this.programId;

        this.use();
        us["projection"] = gl.getUniformLocation(program, 'projection');
        us["view"] = gl.getUniformLocation(program, 'view');
    }
}
