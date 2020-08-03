import { vec3, mat4 } from '../../../math/glmatrix/index.js';
import { fs_lighting, vs_lighting, vs_hdr, fs_hdr } from '../../js/Ch39/shaders/index.js';
import { Shader } from '../../js/common/Shader.js';
import { Mouse } from '../../js/common/Mouse.js';
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
const sizeFloat = 4;
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}
let hdr = true;
let exposure = 1.0;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_1 = '1', GLFW_KEY_2 = '2', GLFW_KEY_Q = 'q', GLFW_KEY_E = 'e';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_1, GLFW_KEY_2, GLFW_KEY_Q, GLFW_KEY_E
});
let shader = null;
let hdrShader = null;
let hdrFBO;
let colorBuffer;
let woodTexture;
let projection = mat4.create(), view = mat4.create();
let lightPositions = null;
let lightColors = null;
let quadVAO = null;
let camera = new Camera(vec3.fromValues(0.0, 0.0, 15.0), vec3.fromValues(0.0, 1.0, 0.0));
let deltaTime = 0.0;
let lastFrame = 0.0;
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;
let cubeVAO = null;
function renderCube() {
    if (!cubeVAO) {
        let vertices = new Float32Array([
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0,
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0,
            -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0,
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0,
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 0.0, 0.0,
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0,
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0,
            1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0,
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0,
            1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0,
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0,
            -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0,
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0,
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0,
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0,
            -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0
        ]);
        cubeVAO = gl.createVertexArray();
        let cubeVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        gl.bindVertexArray(cubeVAO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.bindVertexArray(null);
}
let quadVBO = null;
function renderQuad() {
    let quadVBO = null;
    if (!quadVAO) {
        let quadVertices = new Float32Array([
            -1.0, 1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 0.0,
        ]);
        quadVAO = gl.createVertexArray();
        quadVBO = gl.createBuffer();
        gl.bindVertexArray(quadVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * sizeFloat, (3 * sizeFloat));
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
}
let main = function () {
    gl.enable(gl.DEPTH_TEST);
    shader = new Shader(gl, vs_lighting, fs_lighting);
    hdrShader = new Shader(gl, vs_hdr, fs_hdr);
    woodTexture = loadTexture("../../textures/wood.png", 4, false);
    hdrFBO = gl.createFramebuffer();
    colorBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    let rboDepth;
    rboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);
    let check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check != gl.FRAMEBUFFER_COMPLETE)
        console.log("Framebuffer not complete");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    lightPositions = new Float32Array([
        0.0, 0.0, 49.5,
        -1.4, -1.9, 9.0,
        0.0, -1.8, 4.0,
        0.8, -1.7, 6.0
    ]);
    lightColors = new Float32Array([
        200.0, 200.0, 200.0,
        0.1, 0.0, 0.0,
        0.0, 0.0, 0.2,
        0.0, 0.1, 0.0
    ]);
    shader.use(gl);
    shader.setInt(gl, "diffuseTexture", 0);
    hdrShader.use(gl);
    hdrShader.setInt(gl, "hdrBuffer", 0);
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
    gl.clearColor(0.4, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    view = camera.GetViewMatrix();
    shader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "viewPos"), camera.Position);
    let model = mat4.create();
    mat4.translate(model, model, vec3.fromValues(0.0, 0.0, 25.0));
    mat4.scale(model, model, vec3.fromValues(2.5, 2.5, 27.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    shader.setBoolean(gl, "inverse_normals", true);
    renderCube();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    hdrShader.use(gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    hdrShader.setBoolean(gl, "hdr", hdr);
    hdrShader.setFloat(gl, "exposure", exposure);
    renderQuad();
}
function processInput() {
    const GLFW_PRESS = true;
    if (keyInput.isDown(GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.FORWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.BACKWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.LEFT, deltaTime);
    if (keyInput.isDown(GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.RIGHT, deltaTime);
    if (keyInput.isDown(GLFW_KEY_1) == GLFW_PRESS) {
        hdr = true;
    }
    if (keyInput.isDown(GLFW_KEY_2) == GLFW_PRESS) {
        hdr = false;
    }
    if (keyInput.isDown(GLFW_KEY_Q) == GLFW_PRESS) {
        if (exposure > 0.0)
            exposure -= 0.01;
        else
            exposure = 0.0;
    }
    if (keyInput.isDown(GLFW_KEY_E) == GLFW_PRESS) {
        exposure += 0.01;
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
            internalFormat = gammaCorrection ? gl.SRGB8_ALPHA8 : gl.RGBA;
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
//# sourceMappingURL=hdr.js.map