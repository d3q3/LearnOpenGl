import { vs_lighting_maps, fs_lighting_maps, vs_lamp, fs_lamp } from "../../js/Ch21/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { Cube, Sphere2 } from "../../js/geometry/VertexObjects.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let cubeVAO;
let sphereVAO;
let lightingShader;
let lampShader;
let keyInput;
let mouse;
let diffuseMap;
let specularMap;
let cube;
let sphere;
let lightPos = vec3.fromValues(0.0, 0.5, 2.0);
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
    sphere = new Sphere2(12, 12);
    sphereVAO = createVAO(sphere, { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 });
    cube = new Cube();
    cubeVAO = createVAO(cube, { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 });
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
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularMap);
    let modelCube = mat4.create();
    mat4.translate(modelCube, modelCube, vec3.fromValues(0.5, 0.0, 0.0));
    setMat4vShader(lightingShader, "model", modelCube);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    let modelSphere = mat4.create();
    mat4.translate(modelSphere, modelSphere, vec3.fromValues(-0.5, 0.0, 0.0));
    setMat4vShader(lightingShader, "model", modelSphere);
    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLE_STRIP, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
    lampShader.use(gl);
    setMat4vShader(lampShader, "projection", projection);
    setMat4vShader(lampShader, "view", view);
    let modelLamp = mat4.create();
    mat4.translate(modelLamp, modelLamp, lightPos);
    mat4.scale(modelLamp, modelLamp, vec3.fromValues(0.2, 0.2, 0.2));
    setMat4vShader(lampShader, "model", modelLamp);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
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
function createVAO(vo, layout) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);
    const ebo = gl.createBuffer();
    let vbos = [];
    vo.getBuffers().forEach(buf => {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
        vbos.push(vbo);
    });
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vo.indices, gl.STATIC_DRAW);
    let acc;
    acc = vo.accessors[vo.attributes.POSITION];
    gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
    gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
    gl.enableVertexAttribArray(layout.POSITION);
    if (layout.TEXCOORD_0) {
        acc = vo.accessors[vo.attributes.TEXCOORD_0];
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.TEXCOORD_0);
    }
    if (layout.NORMAL) {
        acc = vo.accessors[vo.attributes.TEXCOORD_0];
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        acc = vo.accessors[vo.attributes.NORMAL];
        gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.NORMAL);
    }
    return VAO;
}
;
//# sourceMappingURL=cubes_spheres.js.map