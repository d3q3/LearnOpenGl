// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About


import { vs_lighting_maps, fs_lighting_maps, vs_lamp, fs_lamp } from "../../js/Ch15/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let cubeVAO;
let lightVAO;
let lightingShader;
let lampShader;
let keyInput;
let mouse;
let diffuseMap;
let specularMap;
let lightPos = vec3.fromValues(0.2, 0.5, 2.0);
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
    camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;
    gl.enable(gl.DEPTH_TEST);
    lightingShader = new Shader(gl, vs_lighting_maps, fs_lighting_maps);
    lampShader = new Shader(gl, vs_lamp, fs_lamp);
    let vertices = new Float32Array([
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 1.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0, 0.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 1.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, -1.0, 0.0, 0.0, 1.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, -1.0, 0.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 0.0, 0.0, 1.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0, 1.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
        0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 1.0, 1.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, -1.0, 0.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0, 0.0, 1.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0,
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 1.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 0.0, 0.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0, 0.0, 1.0
    ]);
    cubeVAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindVertexArray(cubeVAO);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
    gl.enableVertexAttribArray(2);
    lightVAO = gl.createVertexArray();
    gl.bindVertexArray(lightVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    diffuseMap = gl.createTexture();
    loadTexture("../../textures/container2.png", diffuseMap);
    specularMap = gl.createTexture();
    loadTexture("../../textures/container2_specular.png", specularMap);
    lightingShader.use(gl);
    lightingShader.setInt(gl, "material.diffuse", 0);
    lightingShader.setInt(gl, "material.specular", 1);
    requestAnimationFrame(render);
}();
function render() {
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);
    lightingShader.setFloat3(gl, "light.ambient", 0.2, 0.2, 0.2);
    lightingShader.setFloat3(gl, "light.diffuse", 0.5, 0.5, 0.5);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);
    lightingShader.setFloat(gl, "material.shininess", 64.0);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);
    let model = mat4.create();
    setMat4vShader(lightingShader, "model", model);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularMap);
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    lampShader.use(gl);
    setMat4vShader(lampShader, "projection", projection);
    setMat4vShader(lampShader, "view", view);
    mat4.identity(model);
    mat4.translate(model, model, lightPos);
    mat4.scale(model, model, vec3.fromValues(0.2, 0.2, 0.2));
    setMat4vShader(lampShader, "model", model);
    gl.bindVertexArray(lightVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    requestAnimationFrame(render);
}
function processInput() {
    const GLFW_PRESS = true;
    const GLFW_RELEASE = false;
    if (keyInput.isDown(GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.FORWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.BACKWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.LEFT, deltaTime);
    if (keyInput.isDown(GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.RIGHT, deltaTime);
}
function framebufferSizeCallback(width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    requestAnimationFrame(render);
}
function mouseMoveCallback(xoffset, yoffset, buttonID) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}
function mouseScrollCallback(yoffset) {
    camera.ProcessMouseScroll(yoffset);
}
function setVec3vShader(shader, uniformName, value) {
    gl.uniform3fv(gl.getUniformLocation(shader.programId, uniformName), value);
}
function setMat4vShader(shader, uniformName, value) {
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, uniformName), false, value);
}
function componentProduct3(a, b) {
    return vec3.fromValues(a[0] * b[0], a[1] * b[1], a[2] * b[2]);
}
function loadTexture(url, texture) {
    initTexture(gl, texture);
    const image1 = new Image();
    image1.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
    };
    image1.src = url;
}
function initTexture(gl, texture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const width = 1;
    const height = 1;
    const pixel = new Uint8Array([0, 0, 255]);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, width, height, 0, gl.RGB, gl.UNSIGNED_BYTE, pixel);
}
//# sourceMappingURL=lighting_maps_specular.js.map