import { Shader } from "../../../js/gl/shaders/Shader.js";
import { mat3, mat4 } from "../../../../math/glmatrix/index.js";
import { vs_env, fs_env } from "../../../js/gl/shaders/env0/index.js";

export class EnvShader extends Shader {
    glUniforms: Object;
    isCentered: boolean;

    /**
     * D3Q: Use the Shaders-collection to create a Env0Shader
     * @param gl 
     */
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

    center(isCentered: boolean) {
        this.isCentered = isCentered;
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
    /**
     * sets the shader uniform View. If isCentered == true the translation part
     * of view is made zero.
     * @param view parameter does not change: copied
     */
    setView(view: mat4) {
        let centeredView4: mat4 = mat4.clone(view);
        if (this.isCentered) {
            // let centeredView3: mat3 = mat3.create();
            // mat3.fromMat4(centeredView3, centeredView4);
            // mat4.fromRotation()
            centeredView4[12] = 0.0;
            centeredView4[13] = 0.0;
            centeredView4[14] = 0.0;
        }
        this.gl.uniformMatrix4fv(this.glUniforms["view"], false, centeredView4);
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
