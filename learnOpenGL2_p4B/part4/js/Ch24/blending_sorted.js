// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About


import { vec3, mat4 } from '../../../math/glmatrix/index.js';
import { fs_blending, vs_blending } from '../../js/Ch24/shaders/index.js';
import { Shader } from '../../js/common/Shader.js';
import { Mouse } from '../../js/common/Mouse.js';
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
import { Cube, Quad } from '../../js/geometry/VertexObjects.js';
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let canvas;
let gl;
let keyInput;
let camera;
let cube;
let cubeVao;
let plane;
let planeVao;
let transparent;
let transparentVao;
let cubeTexture;
let floorTexture;
let transparentTexture;
let shader;
let windows;
let deltaTime = 0.0;
let lastFrame = 0.0;
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;
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
    camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0), vec3.fromValues(0.0, 1.0, 0.0));
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    shader = new Shader(gl, vs_blending, fs_blending);
    cubeTexture = loadTexture("../../textures/marble.jpg", 4, false);
    floorTexture = loadTexture("../../textures/metal.png", 4, false);
    transparentTexture = loadTexture("../../textures/window.png", 4, false);
    plane = new Quad();
    planeVao = CreateVAO(plane, { POSITION: 0, TEXCOORD_0: 1 });
    cube = new Cube();
    cubeVao = CreateVAO(cube, { POSITION: 0, TEXCOORD_0: 1 });
    transparent = new Quad();
    transparentVao = CreateVAO(transparent, { POSITION: 0, TEXCOORD_0: 1 });
    windows =
        [
            vec3.fromValues(-2.0, 0.0, -0.48),
            vec3.fromValues(3.0, 0.0, 0.51),
            vec3.fromValues(0.0, 0.0, 2.7),
            vec3.fromValues(-0.6, 0.0, -2.3),
            vec3.fromValues(1.0, 0.0, -0.6)
        ];
    shader.use(gl);
    shader.setInt(gl, "texture1", 0);
    requestAnimationFrame(render);
}();
function render() {
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;
    processInput();
    let sortArray = [];
    let sub = vec3.create();
    for (let i = 0; i < windows.length; i++) {
        let distance = vec3.len(vec3.subtract(sub, camera.Position, windows[i]));
        sortArray.push([distance, windows[i]]);
    }
    sortArray.sort(function (a, b) {
        return b[0] - a[0];
    });
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shader.use(gl);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    let view = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    let model = mat4.create();
    mat4.identity(model);
    gl.bindVertexArray(cubeVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    mat4.translate(model, model, vec3.fromValues(-2.0, 0.0, -1.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    mat4.identity(model);
    mat4.translate(model, model, vec3.fromValues(3.0, 0.0, 0.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(planeVao);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    mat4.identity(model);
    mat4.fromXRotation(model, Math.PI / 2);
    mat4.scale(model, model, [5.0, 5.0, 1.0]);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    gl.drawElements(gl.TRIANGLES, plane.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(transparentVao);
    gl.bindTexture(gl.TEXTURE_2D, transparentTexture);
    for (let i = 0, iLen = sortArray.length; i < iLen; i++) {
        model = mat4.identity(model);
        mat4.translate(model, model, sortArray[i][1]);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
        gl.drawElements(gl.TRIANGLES, transparent.indices.length, gl.UNSIGNED_SHORT, 0);
    }
    requestAnimationFrame(render);
}
function framebufferSizeCallback(width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
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
function mouse_move_callback(xoffset, yoffset, buttonID) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}
function mouse_scroll_callback(yoffset) {
    camera.ProcessMouseScroll(yoffset);
}
function CreateVAO(geo, layout) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);
    const vbo = gl.createBuffer();
    const ebo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);
    let acc = geo.accessors[geo.attributes.POSITION];
    gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
    gl.enableVertexAttribArray(layout.POSITION);
    if (layout.TEXCOORD_0) {
        acc = geo.accessors[geo.attributes.TEXCOORD_0];
        gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.TEXCOORD_0);
    }
    if (layout.NORMAL) {
        acc = geo.accessors[geo.attributes.NORMAL];
        gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.NORMAL);
    }
    return VAO;
}
;
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
            dataFormat = gl.RED;
            internalFormat = gl.R8;
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
//# sourceMappingURL=blending_sorted.js.map