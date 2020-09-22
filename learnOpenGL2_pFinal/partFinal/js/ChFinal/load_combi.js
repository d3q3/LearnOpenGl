import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { GltfLoader } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
import { ImageLoader } from "../../js/filing/imageLoader.js";
import { GlManager } from "../../js/gl/GlDrawable.js";
import { DrawCubeMap } from "../../js/geometry/Drawable.js";
import { Texture, CubeMapMaterial } from "../../js/material/Material.js";
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let glManager;
let bottleShader;
let envShader;
let model = mat4.create();
let scale = 0.001;
mat4.scale(model, model, [scale, scale, scale]);
let bottleModel;
let glBottleModel;
let glCubeMap;
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
    let gltfUrl = "../../models/2CylinderEngine/glTF/2CylinderEngine.gltf";
    let gltfLoader = new GltfLoader();
    let imageUrls = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"];
    let imageLoader = new ImageLoader("../../textures/environment/");
    let combined = [gltfLoader.load(gltfUrl), imageLoader.load(imageUrls)];
    Promise.all(combined).then((results) => {
        let gltfResource = results[0];
        resourceLoaded(gltfResource);
        let imagesLoaded = results[1];
        imageLoaded(imagesLoaded);
        afterLoad();
    }).catch(error => alert(error.message));
}();
function resourceLoaded(res) {
    bottleModel = new GltfModel(res, true);
    let scene = bottleModel.getDrawScene(0);
    bottleModel.drawMeshes = bottleModel.getMeshes();
    bottleModel.linkScene(scene);
    glManager = new GlManager(gl);
    glBottleModel = glManager.createGlDrawModel(bottleModel);
    bottleShader = glManager.getShader("pbr0");
}
function imageLoaded(sources) {
    let textures = new Array(sources.length);
    for (let i = 0; i < sources.length; i++) {
        textures[i] = new Texture(i);
        textures[i].sourceData = sources[i];
        textures[i].width = sources[i].naturalWidth;
        textures[i].height = sources[i].naturalHeight;
    }
    let cubeMaterial = new CubeMapMaterial();
    cubeMaterial.textures = textures;
    glManager = new GlManager(gl);
    glCubeMap = glManager.createGlCubeMap(new DrawCubeMap(cubeMaterial));
    envShader = glManager.getShader("env0");
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
    bottleShader.use();
    bottleShader.setLights(lightPositions, lightColors);
    bottleShader.setCameraPosition(camera.Position);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    bottleShader.setProjection(projection);
    bottleShader.setView(view);
    mat4.rotateY(model, model, deltaTime / 1000);
    bottleShader.setModel(model);
    envShader.use();
    envShader.setProjection(projection);
    envShader.setView(view);
    glManager.drawModelObjects(glBottleModel, model);
    glManager.drawGlCubeMap(glCubeMap);
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
//# sourceMappingURL=load_combi.js.map