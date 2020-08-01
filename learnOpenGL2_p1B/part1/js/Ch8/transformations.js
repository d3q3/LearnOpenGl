import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { vs_transform, fs_transform } from "../../js/Ch8/shaders/index.js";
import { Shader } from "../../js/common/Shader.js";
const sizeFloat = 4;
let canvas;
let gl;
let VAO;
let ourShader;
let texture1, texture2;
let main = function () {
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed");
        return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight); };
    ourShader = new Shader(gl, vs_transform, fs_transform);
    let vertices = new Float32Array([
        0.5, 0.5, 0.0, 1.0, 1.0,
        0.5, -0.5, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.0, 0.0, 0.0,
        -0.5, 0.5, 0.0, 0.0, 1.0
    ]);
    let indices = new Uint16Array([
        0, 1, 3,
        1, 2, 3
    ]);
    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    let EBO = gl.createBuffer();
    gl.bindVertexArray(VAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);
    texture1 = gl.createTexture();
    initTexture(gl, texture1);
    const image1 = new Image();
    image1.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image1.src = "../../textures/container.jpg";
    texture2 = gl.createTexture();
    initTexture(gl, texture2);
    const image2 = new Image();
    image2.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture2);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image2);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image2.src = "../../textures/awesomeface.png";
    ourShader.use(gl);
    ourShader.setInt(gl, "texture1", 0);
    ourShader.setInt(gl, "texture2", 1);
    requestAnimationFrame(render);
}();
function render() {
    processInput();
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    let transform = mat4.create();
    mat4.translate(transform, transform, vec3.fromValues(0.5, -0.5, 0.0));
    mat4.rotateZ(transform, transform, performance.now() / 1000);
    ourShader.use(gl);
    let transformLoc = gl.getUniformLocation(ourShader.programId, "transform");
    gl.uniformMatrix4fv(transformLoc, false, transform);
    gl.bindVertexArray(VAO);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    requestAnimationFrame(render);
}
function processInput() {
}
function framebufferSizeCallback(width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    requestAnimationFrame(render);
}
function initTexture(gl, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const width = 1;
    const height = 1;
    const pixel = new Uint8Array([0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixel);
}
//# sourceMappingURL=transformations.js.map