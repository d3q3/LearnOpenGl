export class Shader {
    programId: number;

    private createShader = function (gl, source, type) {
        var shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        return shader;
    }

    constructor(gl, vertexCode: string, fragmentCode: string, geometryCode?) {
        var program = gl.createProgram();
        var vshader = this.createShader(gl, vertexCode, gl.VERTEX_SHADER);
        var fshader = this.createShader(gl, fragmentCode, gl.FRAGMENT_SHADER);

        gl.attachShader(program, vshader);
        gl.deleteShader(vshader);
        gl.attachShader(program, fshader);
        gl.deleteShader(fshader);
        gl.linkProgram(program);

        var log = gl.getProgramInfoLog(program);
        if (log) {
            console.log(log);
        }

        log = gl.getShaderInfoLog(vshader);
        if (log) {
            console.log(log);
        }

        log = gl.getShaderInfoLog(fshader);
        if (log) {
            console.log(log);
        }

        this.programId = program;
    };

    // activate the shader
    // ------------------------------------------------------------------------
    use(gl) {
        gl.useProgram(this.programId);
    }
    // utility uniform functions
    // ------------------------------------------------------------------------
    setBoolean(gl, name: string, value: boolean) {
        gl.uniform1i(gl.getUniformLocation(this.programId, name), value ? 1 : 0);
    }
    // ------------------------------------------------------------------------
    setInt(gl: WebGL2RenderingContext, name, value: number) {
        gl.uniform1i(gl.getUniformLocation(this.programId, name), value);
    }
    // ------------------------------------------------------------------------
    setFloat(gl, name, value: number) {
        gl.uniform1f(gl.getUniformLocation(this.programId, name), value);
    }
    // // ------------------------------------------------------------------------
    // void setVec2(const std:: string & name, const glm:: vec2 & value) const
    //     {
    //         glUniform2fv(glGetUniformLocation(ID, name.c_str()), 1, & value[0]); 
    //     }
    // void setVec2(const std:: string & name, float x, float y) const
    //     {
    //         glUniform2f(glGetUniformLocation(ID, name.c_str()), x, y); 
    //     }
    // // ------------------------------------------------------------------------
    // void setVec3(const std:: string & name, const glm:: vec3 & value) const
    //     {
    //         glUniform3fv(glGetUniformLocation(ID, name.c_str()), 1, & value[0]); 
    //     }
    // void setVec3(const std:: string & name, float x, float y, float z) const
    //     {
    //         glUniform3f(glGetUniformLocation(ID, name.c_str()), x, y, z); 
    //     }
    // // ------------------------------------------------------------------------
    // void setVec4(const std:: string & name, const glm:: vec4 & value) const
    //     {
    //         glUniform4fv(glGetUniformLocation(ID, name.c_str()), 1, & value[0]); 
    //     }
    // void setVec4(const std:: string & name, float x, float y, float z, float w)
    // {
    //     glUniform4f(glGetUniformLocation(ID, name.c_str()), x, y, z, w);
    // }
    // // ------------------------------------------------------------------------
    // void setMat2(const std:: string & name, const glm:: mat2 & mat) const
    //     {
    //         glUniformMatrix2fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, & mat[0][0]);
    //     }
    // // ------------------------------------------------------------------------
    // void setMat3(const std:: string & name, const glm:: mat3 & mat) const
    //     {
    //         glUniformMatrix3fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, & mat[0][0]);
    //     }
    // // ------------------------------------------------------------------------
    // void setMat4(const std:: string & name, const glm:: mat4 & mat) const
    //     {
    //         glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, & mat[0][0]);
    //     }

}



// private:
// // utility function for checking shader compilation/linking errors.
// // ------------------------------------------------------------------------
// void checkCompileErrors(GLuint shader, std:: string type)
// {
//     GLint success;
//     GLchar infoLog[1024];
//     if (type != "PROGRAM") {
//         glGetShaderiv(shader, GL_COMPILE_STATUS, & success);
//         if (!success) {
//             glGetShaderInfoLog(shader, 1024, NULL, infoLog);
//             std:: cout << "ERROR::SHADER_COMPILATION_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std:: endl;
//         }
//     }
//     else {
//         glGetProgramiv(shader, GL_LINK_STATUS, & success);
//         if (!success) {
//             glGetProgramInfoLog(shader, 1024, NULL, infoLog);
//             std:: cout << "ERROR::PROGRAM_LINKING_ERROR of type: " << type << "\n" << infoLog << "\n -- --------------------------------------------------- -- " << std:: endl;
//         }
//     }
// }
// };
// #endif