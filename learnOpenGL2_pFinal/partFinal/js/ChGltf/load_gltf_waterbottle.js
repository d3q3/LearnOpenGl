import { vs_pbr, fs_pbr } from "../../js/ChGltf/shaders/1/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/material/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { GltfLoader } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
import { GlManager } from "../../js/gl/GlDrawable.js";
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
const TEXUNIT_ALBEDO = 0, TEXUNIT_NORMAL = 1, TEXUNIT_PBR = 2;
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let glManager;
let bottleModel;
let glBottleModel;
let model = mat4.create();
let bottleShader;
let keyInput;
let mouse;
let lightPositions;
let lightColors;
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
    camera = new Camera(vec3.fromValues(0.0, 0.0, 0.75), vec3.fromValues(0.0, 1.0, 0.0));
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;
    let gltfUrl = "../../models/WaterBottle/glTF/WaterBottle.gltf";
    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res) => resourcesLoaded(res)).catch(error => alert(error.message));
}();
function resourcesLoaded(res) {
    bottleModel = new GltfModel(res, true);
    bottleModel.drawMeshes = bottleModel.getMeshes();
    glManager = new GlManager(gl);
    glBottleModel = glManager.createGlDrawModel(bottleModel);
    bottleShader = new Shader(gl, vs_pbr, fs_pbr);
    bottleShader.use(gl);
    bottleShader.setInt(gl, "albedoMap", TEXUNIT_ALBEDO);
    bottleShader.setInt(gl, "normalMap", TEXUNIT_NORMAL);
    bottleShader.setInt(gl, "occlusionMetallicRoughnessMap", TEXUNIT_PBR);
    afterLoad();
}
function afterLoad() {
    gl.enable(gl.DEPTH_TEST);
    requestAnimationFrame(render);
}
function render() {
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    bottleShader.use(gl);
    gl.uniform3fv(gl.getUniformLocation(bottleShader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(bottleShader.programId, "lightColors"), lightColors);
    setVec3vShader(bottleShader, "camPos", camera.Position);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(bottleShader, "projection", projection);
    setMat4vShader(bottleShader, "view", view);
    mat4.rotateY(model, model, deltaTime / 1000);
    setMat4vShader(bottleShader, "model", model);
    for (let i = 0; i < glBottleModel.glDrawMeshes.length; i++) {
        let glMesh = glBottleModel.glDrawMeshes[i];
        for (let j = 0; j < glMesh.glDrawObjects.length; j++) {
            if (glMesh.glDrawObjects[j].material.type = "gltf") {
                let material = glMesh.glDrawObjects[j].material;
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_ALBEDO);
                gl.bindTexture(gl.TEXTURE_2D, glBottleModel.glTextures[material.attributes.ALBEDO]);
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
                gl.bindTexture(gl.TEXTURE_2D, glBottleModel.glTextures[material.attributes.NORMAL]);
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_PBR);
                gl.bindTexture(gl.TEXTURE_2D, glBottleModel.glTextures[material.attributes.PBR]);
                gl.bindVertexArray(glMesh.glDrawObjects[j].vao);
                gl.drawElements(gl.TRIANGLES, glMesh.glDrawObjects[j].indexAccessor.countElements, gl.UNSIGNED_SHORT, glMesh.glDrawObjects[j].indexAccessor.byteOffset);
            }
        }
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
//# sourceMappingURL=load_gltf_waterbottle.js.map