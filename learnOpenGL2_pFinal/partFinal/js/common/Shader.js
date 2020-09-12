export class Shader {
    constructor(gl, vertexCode, fragmentCode, geometryCode) {
        this.createShader = function (gl, source, type) {
            var shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            return shader;
        };
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
    }
    ;
    use(gl) {
        gl.useProgram(this.programId);
    }
    setBoolean(gl, name, value) {
        gl.uniform1i(gl.getUniformLocation(this.programId, name), value ? 1 : 0);
    }
    setInt(gl, name, value) {
        gl.uniform1i(gl.getUniformLocation(this.programId, name), value);
    }
    setFloat(gl, name, value) {
        gl.uniform1f(gl.getUniformLocation(this.programId, name), value);
    }
    setFloat2(gl, name, value1, value2) {
        gl.uniform2f(gl.getUniformLocation(this.programId, name), value1, value2);
    }
    setFloat3(gl, name, value1, value2, value3) {
        gl.uniform3f(gl.getUniformLocation(this.programId, name), value1, value2, value3);
    }
    setFloat4(gl, name, value1, value2, value3, value4) {
        gl.uniform4f(gl.getUniformLocation(this.programId, name), value1, value2, value3, value4);
    }
}
//# sourceMappingURL=Shader.js.map