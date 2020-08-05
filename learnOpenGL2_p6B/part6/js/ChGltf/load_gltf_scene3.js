import { vs_pbr, fs_pbr } from "../../js/ChGltf/shaders/3/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { PbrShader } from "../../js/ChGltf/PbrShader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { GltfLoader } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../../js/geometry/GltfModel.js";
import { GlSceneManager } from "../../js/ChGltf/glSceneManager.js";
import { GlMaterialManager } from "../../js/ChGltf/glMaterialManager.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let gltfCamera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let glScene;
let glMaterialModel;
let glSceneManager;
let glMaterialManager;
let pbrShader;
let keyInput;
let mouse;
let lightPositions = new Float32Array([
    -10.0, 10.0, 10.0,
    10.0, 10.0, 10.0,
    -10.0, -10.0, 10.0,
    10.0, -10.0, 10.0
]);
let lightColors = new Float32Array([
    300.0, 300.0, 300.0,
    300.0, 300.0, 300.0,
    300.0, 300.0, 300.0,
    300.0, 300.0, 300.0
]);
let gltfUrl = "../../models/WaterBottle/glTF/WaterBottle.gltf";
let scaleModel = 15.0;
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
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;
    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res) => resourcesLoaded(res)).catch(error => alert(error.message));
}();
function resourcesLoaded(res) {
    let model = new GltfModel(res, true);
    let scene = model.getScene(0);
    camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0), vec3.fromValues(0.0, 1.0, 0.0));
    let cameras = scene.getCameraNodes();
    if (cameras) {
        gltfCamera = cameras[0];
    }
    ;
    if (gltfCamera) {
        let v = gltfCamera.getView();
        let t = gltfCamera.getPosition();
    }
    glSceneManager = new GlSceneManager(gl);
    glMaterialManager = new GlMaterialManager(gl);
    glScene = glSceneManager.getGlScene(model, 0);
    glMaterialModel = glMaterialManager.getGlMaterialModelGltf(model);
    afterLoad();
}
function afterLoad() {
    gl.enable(gl.DEPTH_TEST);
    pbrShader = new PbrShader(gl, vs_pbr, fs_pbr);
    pbrShader.setMaterialModel(glMaterialModel);
    requestAnimationFrame(render);
}
function render() {
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    pbrShader.use(gl);
    gl.uniform3fv(gl.getUniformLocation(pbrShader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(pbrShader.programId, "lightColors"), lightColors);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view;
    view = camera.GetViewMatrix();
    setMat4vShader(pbrShader, "projection", projection);
    setMat4vShader(pbrShader, "view", view);
    setVec3vShader(pbrShader, "camPos", camera.Position);
    for (let i = 0, ilen = glScene.drawMeshes.length; i < ilen; i++) {
        let model = mat4.clone(glScene.drawMeshes[i].ppMatrix);
        let scale = mat4.create();
        mat4.fromScaling(scale, vec3.fromValues(scaleModel, scaleModel, scaleModel));
        mat4.multiply(model, scale, model);
        setMat4vShader(pbrShader, "model", model);
        let mesh = glScene.drawMeshes[i];
        for (let j = 0; j < mesh.glMesh.vaos.length; j++) {
            pbrShader.setMaterial(gl, mesh.glMesh.mats[j]);
            gl.bindVertexArray(mesh.glMesh.vaos[j]);
            gl.drawElements(gl.TRIANGLES, mesh.glMesh.vos[j].indexAccessor.countElements, gl.UNSIGNED_SHORT, mesh.glMesh.vos[j].indexAccessor.byteOffset);
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
//# sourceMappingURL=load_gltf_scene3.js.map