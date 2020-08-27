// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About


import { vec2, vec3, mat4 } from '../../../math/glmatrix/index.js';
import { vs_pbr, fs_pbr } from '../../js/Ch44/shaders/1/index.js';
import { Shader } from '../../js/common/Shader.js';
import { Mouse } from '../../js/common/Mouse.js';
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
const sizeFloat = 4;
let indexCount = 0;
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_SPACE
});
let shader = null;
let projection = mat4.create(), view = mat4.create();
let model = mat4.create();
let lightPositions = null;
let lightColors = null;
const nrRows = 7;
const nrColumns = 7;
const spacing = 2.5;
let sphereVAO = null;
let camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0), vec3.fromValues(0.0, 1.0, 0.0));
let deltaTime = 0.0;
let lastFrame = 0.0;
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;
let main = function () {
    gl.enable(gl.DEPTH_TEST);
    shader = new Shader(gl, vs_pbr, fs_pbr);
    shader.use(gl);
    gl.uniform3f(gl.getUniformLocation(shader.programId, "albedo"), 0.5, 0.0, 0.0);
    shader.setFloat(gl, "ao", 1.0);
    lightPositions = new Float32Array([
        -10.0, 10.0, 10.0,
        10.0, 10.0, 10.0,
        -10.0, -10.0, 10.0,
        10.0, -10.0, 10.0
    ]);
    lightColors = new Float32Array([
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0,
        300.0, 300.0, 300.0
    ]);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);
    animate();
}();
function animate() {
    render();
    requestAnimationFrame(animate);
}
function render() {
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shader.use(gl);
    view = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "camPos"), new Float32Array(camera.Position));
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    mat4.identity(model);
    for (let row = 0; row < nrRows; row++) {
        shader.setFloat(gl, "metallic", row / (nrRows - 1));
        for (let col = 0; col < nrColumns; col++) {
            let r = Math.max(col / (nrColumns - 1), 0.025);
            shader.setFloat(gl, "roughness", r);
            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues((col - (nrColumns / 2)) * spacing, (row - (nrRows / 2)) * spacing, 0.0));
            gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
            renderSphere();
        }
    }
    for (let i = 0; i < lightPositions.length / 3; ++i) {
        let newPos = vec3.fromValues(lightPositions[3 * i], lightPositions[3 * i + 1], lightPositions[3 * i + 2]);
        shader.setFloat(gl, "metallic", 1.0);
        shader.setFloat(gl, "roughness", 1.0);
        mat4.identity(model);
        mat4.translate(model, model, newPos);
        mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
        gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
        renderSphere();
    }
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
function mouse_move_callback(xoffset, yoffset, buttonID) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}
function mouse_scroll_callback(yoffset) {
    camera.ProcessMouseScroll(yoffset);
}
function renderSphere() {
    if (sphereVAO == null) {
        sphereVAO = gl.createVertexArray();
        let vbo, ebo;
        vbo = gl.createBuffer();
        ebo = gl.createBuffer();
        let positions = [];
        let uv = [];
        let normals = [];
        let indices = [];
        ;
        const X_SEGMENTS = 64;
        const Y_SEGMENTS = 64;
        const PI = 3.14159265359;
        for (let y = 0; y <= Y_SEGMENTS; ++y) {
            for (let x = 0; x <= X_SEGMENTS; ++x) {
                let xSegment = x / X_SEGMENTS;
                let ySegment = y / Y_SEGMENTS;
                let xPos = Math.cos(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
                let yPos = Math.cos(ySegment * PI);
                let zPos = Math.sin(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
                positions.push(vec3.fromValues(xPos, yPos, zPos));
                uv.push(vec2.fromValues(xSegment, ySegment));
                normals.push(vec3.fromValues(xPos, yPos, zPos));
            }
        }
        let oddRow = false;
        for (let y = 0; y < Y_SEGMENTS; ++y) {
            if (!oddRow) {
                for (let x = 0; x <= X_SEGMENTS; ++x) {
                    indices.push(y * (X_SEGMENTS + 1) + x);
                    indices.push((y + 1) * (X_SEGMENTS + 1) + x);
                }
            }
            else {
                for (let x = X_SEGMENTS; x >= 0; --x) {
                    indices.push((y + 1) * (X_SEGMENTS + 1) + x);
                    indices.push(y * (X_SEGMENTS + 1) + x);
                }
            }
            oddRow = !oddRow;
        }
        indexCount = indices.length;
        let data = [];
        for (let i = 0; i < positions.length; ++i) {
            data.push(positions[i][0]);
            data.push(positions[i][1]);
            data.push(positions[i][2]);
            if (uv.length > 0) {
                data.push(uv[i][0]);
                data.push(uv[i][1]);
            }
            if (normals.length > 0) {
                data.push(normals[i][0]);
                data.push(normals[i][1]);
                data.push(normals[i][2]);
            }
        }
        gl.bindVertexArray(sphereVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        let stride = (3 + 2 + 3) * 4;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, (3 * 4));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, (5 * 4));
    }
    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_SHORT, 0);
}
//# sourceMappingURL=lighting.js.map