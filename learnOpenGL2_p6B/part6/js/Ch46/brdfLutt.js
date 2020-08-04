import { vs_brdf, fs_brdf, } from '../../js/Ch46/shaders/1/index.js';
import { Shader } from '../../js/common/Shader.js';
const sizeFloat = 4;
const whCube = 512;
let canvas = document.createElement('canvas');
canvas.width = whCube;
canvas.height = whCube;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}
let brdfShader = null;
let textureShader = null;
let quadVAO = null;
let captureFBO = null;
let brdfLUTTexture = null;
let error;
let main = function () {
    brdfShader = new Shader(gl, vs_brdf, fs_brdf);
    brdfLUTTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, whCube, whCube, 0, gl.RG, gl.FLOAT, new Float32Array(whCube * whCube * 2), 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    let captureRBO = gl.createRenderbuffer();
    captureFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, whCube, whCube);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE)
        console.log("framebuf(brdf-depth) status error= " + error);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, brdfLUTTexture, 0);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE)
        console.log("framebuf(brdf-tetxure) status error= " + error);
    gl.viewport(0, 0, whCube, whCube);
    brdfShader.use(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderQuad();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    let vs_texture = `#version 300 es
precision mediump float;
layout (location = 0) in vec3 aPos;
layout (location = 1) in vec3 aColor;
layout (location = 2) in vec2 aTexCoord;
out vec3 ourColor;
out vec2 TexCoord;
void main()
{
gl_Position = vec4(aPos, 1.0);
ourColor = aColor;
TexCoord = aTexCoord;
}`;
    let fs_texture = `#version 300 es
precision mediump float;
out vec4 FragColor;
in vec3 ourColor;
in vec2 TexCoord;
uniform sampler2D ourTexture;
void main()
{
    //D3Q: test. FragColor = vec4(ourColor, 1.0); //texture(ourTexture, TexCoord);
    FragColor = texture(ourTexture, TexCoord);
}`;
    textureShader = new Shader(gl, vs_texture, fs_texture);
    textureShader.use(gl);
    textureShader.setInt(gl, "ourTexture", 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderQuad();
}();
function renderQuad() {
    if (!quadVAO) {
        let vertices = new Float32Array([
            -1.0, -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
        ]);
        quadVAO = gl.createVertexArray();
        let quadVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindVertexArray(quadVAO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
}
//# sourceMappingURL=brdfLutt.js.map