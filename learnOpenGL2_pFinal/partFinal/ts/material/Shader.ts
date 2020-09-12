export class Shader {
    // the gl id of the linked gl-program
    programId: number;

    /**
     * D3Q: compiles shader code given source-code
     * types: for now only gl.VERTEX_SHADER or gl.FRAGMENT_SHADER
     */
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

    // D3Q: set this shader in use
    use(gl) {
        gl.useProgram(this.programId);
    }

    // D3Q: functions to set uniforms
    // no support given for math elements like matrices

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

    setFloat2(gl, name, value1: number, value2: number) {
        gl.uniform2f(gl.getUniformLocation(this.programId, name), value1, value2);
    }
    setFloat3(gl, name, value1: number, value2: number, value3: number) {
        gl.uniform3f(gl.getUniformLocation(this.programId, name),
            value1, value2, value3);
    }
    setFloat4(gl, name, value1: number, value2: number, value3: number, value4: number) {
        gl.uniform4f(gl.getUniformLocation(this.programId, name),
            value1, value2, value3, value4);
    }
}
