import { vs_materials, fs_materials } from "../../js/Ch48/shaders/index.js";
import { vec2, vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { Ellipse } from "../../js/geometry/curves2d.js";
import { Earcut } from "../../js/geometry/Earcut.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let ellipsVAO;
let indices;
let lightingShader;
let keyInput;
let mouse;
let lightPos = vec3.fromValues(0.5, 0.7, 2.0);
let main = function () {
    canvas = document.querySelector('#canvas1');
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
    lightingShader = new Shader(gl, vs_materials, fs_materials);
    let ellipse = new Ellipse(vec2.create(), vec2.fromValues(0.8, 0.6), 0, 1.5 * Math.PI);
    const count = 40;
    let pts = ellipse.getSpacedPoints(count);
    let earPts = new Float32Array(2 * count + 2);
    for (let i = 0; i < count; i++) {
        earPts[2 * i] = pts[i][0];
        earPts[2 * i + 1] = pts[i][1];
    }
    earPts[2 * count] = 0;
    earPts[2 * count + 1] = 0;
    indices = new Uint16Array(Earcut.triangulate(earPts, null));
    indices.forEach((tri) => { console.log("" + tri + "\n"); });
    const row = 6;
    let vertices = new Float32Array(row * (count + 1));
    for (let i = 0; i < count + 1; i++) {
        vertices[i * row] = earPts[2 * i];
        vertices[i * row + 1] = earPts[2 * i + 1];
        vertices[i * row + 2] = 0;
        vertices[i * row + 3] = 0;
        vertices[i * row + 4] = 0;
        vertices[i * row + 5] = -1.0;
    }
    ellipsVAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    let EBO = gl.createBuffer();
    gl.bindVertexArray(ellipsVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);
    requestAnimationFrame(render);
}();
function render() {
    let currentFrame = performance.now() / 2000;
    deltaTime = (currentFrame - lastFrame) * 500;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);
    let lightColor = vec3.create();
    lightColor[0] = 1.0;
    lightColor[1] = 1.0;
    lightColor[2] = 1.0;
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.7, 0.7, 0.7));
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.4, 0.4, 0.4));
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 1.0, 0.8, 1.0);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 32.0);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);
    let model = mat4.create();
    setMat4vShader(lightingShader, "model", model);
    gl.bindVertexArray(ellipsVAO);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
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
//# sourceMappingURL=ellips2D.js.map