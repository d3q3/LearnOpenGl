// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { vs_coordinate_systems, fs_coordinate_systems } from "../../js/Ch9/shaders/index.js";
import { Shader } from "../../js/common/Shader.js";
const sizeFloat = 4;
let canvas;
let gl;
let VAO;
let ourShader;
let texture1, texture2;
let cubePositions;
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
    gl.enable(gl.DEPTH_TEST);
    ourShader = new Shader(gl, vs_coordinate_systems, fs_coordinate_systems);
    let vertices = new Float32Array([
        -0.5, -0.5, -0.5, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 1.0,
        0.5, 0.5, 0.5, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        -0.5, 0.5, 0.5, 1.0, 0.0,
        -0.5, 0.5, -0.5, 1.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        -0.5, 0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, 0.5, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 1.0,
        0.5, 0.5, -0.5, 1.0, 1.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0
    ]);
    cubePositions = [
        vec3.fromValues(0.0, 0.0, 0.0),
        vec3.fromValues(2.0, 5.0, -15.0),
        vec3.fromValues(-1.5, -2.2, -2.5),
        vec3.fromValues(-3.8, -2.0, -12.3),
        vec3.fromValues(2.4, -0.4, -3.5),
        vec3.fromValues(-1.7, 3.0, -7.5),
        vec3.fromValues(1.3, -2.0, -2.5),
        vec3.fromValues(1.5, 2.0, -2.5),
        vec3.fromValues(1.5, 0.2, -1.5),
        vec3.fromValues(-1.3, 1.0, -1.5)
    ];
    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    gl.bindVertexArray(VAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
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
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    ourShader.use(gl);
    let view = mat4.create();
    let projection = mat4.create();
    mat4.perspective(projection, 45.0 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    mat4.translate(view, view, vec3.fromValues(0.0, 0.0, -3.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(ourShader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(ourShader.programId, "view"), false, view);
    gl.bindVertexArray(VAO);
    for (let i = 0; i < 10; i++) {
        let model = mat4.create();
        model = mat4.translate(model, model, cubePositions[i]);
        let angle = 20.0 * i;
        mat4.rotate(model, model, (angle) * Math.PI / 180, vec3.fromValues(1.0, 0.3, 0.5));
        gl.uniformMatrix4fv(gl.getUniformLocation(ourShader.programId, "model"), false, model);
        gl.drawArrays(gl.TRIANGLES, 0, 36);
    }
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
//# sourceMappingURL=coordinate_systems_multiple.js.map