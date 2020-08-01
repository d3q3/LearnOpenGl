import { vs_camera, fs_camera } from "../../js/Ch10/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/shader.js";
import { Camera, CameraMovement } from "../../js/common/camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let VAO;
let ourShader;
let texture1, texture2;
let cubePositions;
let keyInput;
let mouse;
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
    camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0), -80.0);
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;
    gl.enable(gl.DEPTH_TEST);
    ourShader = new Shader(gl, vs_camera, fs_camera);
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
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture1);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, texture2);
    ourShader.use(gl);
    let projection = mat4.create();
    mat4.perspective(projection, camera.Zoom * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(ourShader.programId, "projection"), false, projection);
    let view = camera.GetViewMatrix();
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
function mouseMoveCallback(xoffset, yoffset, buttonID) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}
function mouseScrollCallback(yoffset) {
    camera.ProcessMouseScroll(yoffset);
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
//# sourceMappingURL=camera_class.js.map