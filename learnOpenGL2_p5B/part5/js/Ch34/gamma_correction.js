// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About


import { vec3, mat4 } from '../../../math/glmatrix/index.js';
import { fs_gamma_correction, vs_gamma_correction } from '../../js/Ch34/shaders/index.js';
import { Shader } from '../../js/common/Shader.js';
import { Mouse } from '../../js/common/Mouse.js';
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl2', { antialias: true });
let gammaEnabled = false;
let gammaKeyPressed = false;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({ GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D, GLFW_KEY_SPACE });
let shader = null;
let glPlaneVAO = 0;
let floorTexture = loadTexture("../../textures/wood.png", 4, false);
let floorTextureGammaCorrected = loadTexture("../../textures/wood.png", 4, true);
let lightPositions = null;
let lightColors = null;
let projection = mat4.create(), view = mat4.create();
let camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));
let deltaTime = 0.0;
let lastFrame = 0.0;
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;
let main = function () {
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    shader = new Shader(gl, vs_gamma_correction, fs_gamma_correction);
    let planeVertices = [
        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,
        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,
        10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 10.0, 10.0
    ];
    const POSITION_LOCATION = 0;
    const NORMAL_LOCATION = 1;
    const TEXCOORD_0_LOCATION = 2;
    const sizeFloat = 4;
    glPlaneVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();
    gl.bindVertexArray(glPlaneVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(POSITION_LOCATION);
    gl.vertexAttribPointer(POSITION_LOCATION, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
    gl.enableVertexAttribArray(NORMAL_LOCATION);
    gl.vertexAttribPointer(NORMAL_LOCATION, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(TEXCOORD_0_LOCATION);
    gl.vertexAttribPointer(TEXCOORD_0_LOCATION, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
    gl.bindVertexArray(null);
    floorTexture = loadTexture("../../textures/wood.png", 4, false);
    floorTextureGammaCorrected = loadTexture("../../textures/wood.png", 4, true);
    shader.use(gl);
    let floorTextureLocation = gl.getUniformLocation(shader.programId, "floorTexture");
    gl.uniform1i(floorTextureLocation, 0);
    lightPositions = new Float32Array([
        -3.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        3.0, 0.0, 0.0
    ]);
    lightColors = new Float32Array([
        0.25, 0.25, 0.25,
        0.50, 0.50, 0.50,
        0.75, 0.75, 0.75,
        1.00, 1.00, 1.00
    ]);
    animate();
}();
function animate() {
    render(glPlaneVAO, shader);
    requestAnimationFrame(animate);
}
function render(vao, shader) {
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shader.use(gl);
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    view = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "viewPos"), camera.Position);
    gl.uniform1i(gl.getUniformLocation(shader.programId, "gamma"), gammaEnabled ? 1 : 0);
    gl.bindVertexArray(glPlaneVAO);
    gl.activeTexture(gl.TEXTURE0);
    let floorTex = gammaEnabled ? floorTextureGammaCorrected : floorTexture;
    gl.bindTexture(gl.TEXTURE_2D, floorTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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
    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_PRESS && !gammaKeyPressed) {
        gammaEnabled = !gammaEnabled;
        gammaKeyPressed = true;
    }
    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_RELEASE) {
        gammaKeyPressed = false;
    }
}
function mouse_move_callback(xoffset, yoffset, buttonID) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}
function mouse_scroll_callback(yoffset) {
    camera.ProcessMouseScroll(yoffset);
}
function loadTexture(url, nrComponents, gammaCorrection) {
    const textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);
    const level = 0;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, 1, 1, 0, gl.RGBA, srcType, pixel);
    const image = new Image();
    image.onload = function () {
        let internalFormat;
        let dataFormat;
        if (nrComponents == 1) {
            internalFormat = dataFormat = gl.RED;
        }
        else if (nrComponents == 3) {
            internalFormat = gammaCorrection ? gl.SRGB : gl.RGB;
            dataFormat = gl.RGB;
        }
        else if (nrComponents == 4) {
            internalFormat = gammaCorrection ? gl.SRGB8_ALPHA8 : gl.RGBA8;
            dataFormat = gl.RGBA;
        }
        gl.bindTexture(gl.TEXTURE_2D, textureID);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, image.naturalWidth, image.naturalHeight, 0, dataFormat, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };
    image.src = url;
    return textureID;
}
//# sourceMappingURL=gamma_correction.js.map