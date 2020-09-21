import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";

import { GltfLoader, GltfResource } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
import { ImageLoader } from "../../js/filing/imageLoader.js"

import { PbrShader } from "../../js/gl/shaders/Pbr0Shader.js";
import { EnvShader } from "../../js/gl/shaders/Env0Shader.js";
import { GlManager, GlDrawModel, GlDrawCubeMapObject } from "../../js/gl/GlDrawable.js";
import { DrawModel, DrawScene, DrawCubeMap } from "../../js/geometry/Drawable.js";
import { Texture, CubeMapMaterial } from "../../js/material/Material.js";

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';

let camera: Camera;

let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// D3Q: global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let glManager: GlManager;
let bottleShader: PbrShader;
let envShader: EnvShader;

let model: mat4 = mat4.create();
let scale = 0.001; //with model 2CylinderEngine: scale = 0.001
mat4.scale(model, model, [scale, scale, scale]);

let bottleModel: DrawModel;
let glBottleModel: GlDrawModel;
let glCubeMap: GlDrawCubeMapObject;

let keyInput: KeyInput;
let mouse: Mouse;

// lighting: 4 intense white lamps
let lightPositions: Float32Array;
let lightColors: Float32Array;

let main = function () {
    // D3Q: canvas creation and initializing OpenGL rendering context 
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed"); return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight) }

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

    // D3Q: process all mouse input using callbacks
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;

    // D3Q: load our mesh
    let gltfUrl = "../../models/2CylinderEngine/glTF/2CylinderEngine.gltf";
    //let gltfUrl = "../../models/WaterBottle/glTF/WaterBottle.gltf";
    let gltfLoader = new GltfLoader();
    //let promGltf = gltfLoader.load(gltfUrl);

    // D3Q: load our environment; names in OpenGl order of GL_TEXTURE_CUBE_MAP_xxx
    //let imageUrls = ["Right.png", "Left.png", "Top.png", "Bottom.png", "Back.png", "Front.png"];
    //let imageUrls = ["right.jpg", "left.jpg", "top.jpg", "bottom.jpg", "back.jpg", "front.jpg"];
    let imageUrls = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"];
    let imageLoader: ImageLoader = new ImageLoader("../../textures/environment/");
    //let promImages = imageLoader.load(imageUrls);

    //promImages.then((images: HTMLImageElement[]) => resourcesLoaded(images)).catch(error => alert(error));

    //promGltf.then((res: GltfResource) => resourcesLoaded(res)).catch(error => alert(error.message));

    let combined: [Promise<GltfResource>, Promise<HTMLImageElement[]>] =
        [gltfLoader.load(gltfUrl), imageLoader.load(imageUrls)];

    Promise.all(combined).then((results: any[]) => {
        let gltfResource: any = results[0];
        resourceLoaded(gltfResource);

        let imagesLoaded: any = results[1];
        imageLoaded(imagesLoaded);

        afterLoad()
    }).catch(error => alert(error.message));
}();

function resourceLoaded(res: GltfResource): void {
    // D3Q: create the data objects for the model(s)
    bottleModel = new GltfModel(res, true);

    let scene: DrawScene = bottleModel.getDrawScene(0);
    bottleModel.drawMeshes = bottleModel.getMeshes();
    bottleModel.linkScene(scene);

    // D3Q: now create the gl-objects for the model(s) using GlManager
    glManager = new GlManager(gl);
    glBottleModel = glManager.createGlDrawModel(bottleModel);
    bottleShader = glManager.getShader("pbr0") as PbrShader;
}

function imageLoaded(sources: HTMLImageElement[]): void {
    let textures: Texture[] = new Array(sources.length);
    for (let i = 0; i < sources.length; i++) {
        textures[i] = new Texture(i);
        textures[i].sourceData = sources[i];
        textures[i].width = sources[i].naturalWidth;
        textures[i].height = sources[i].naturalHeight;
    }
    let cubeMaterial: CubeMapMaterial = new CubeMapMaterial();
    cubeMaterial.textures = textures;

    // D3Q: create the gl-objects for the model(s) using GlManager
    glManager = new GlManager(gl);
    glCubeMap = glManager.createGlCubeMap(new DrawCubeMap(cubeMaterial));
    envShader = glManager.getShader("env0") as EnvShader;
}

function afterLoad() {
    gl.enable(gl.DEPTH_TEST);
    requestAnimationFrame(render);
}

// D3Q: render loop
function render() {
    let currentFrame = performance.now() / 1000;

    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;

    processInput();

    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // D3Q: update the shaders used in the model(s)
    bottleShader.use();
    bottleShader.setLights(lightPositions, lightColors);
    bottleShader.setCameraPosition(camera.Position);

    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    bottleShader.setProjection(projection);
    bottleShader.setView(view);

    mat4.rotateY(model, model, deltaTime / 1000);
    bottleShader.setModel(model);

    envShader.use();
    envShader.setProjection(projection);
    envShader.setView(view);

    // D3Q: render the model
    glManager.drawModelObjects(glBottleModel, model);

    // D3Q: render the model
    glManager.drawGlCubeMap(glCubeMap);
    requestAnimationFrame(render);
}

// D3Q: query whether relevant keys are pressed
function processInput() {
    const GLFW_PRESS = true; const GLFW_RELEASE = false;
    if (keyInput.isDown(GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.FORWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.BACKWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.LEFT, deltaTime);
    if (keyInput.isDown(GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.RIGHT, deltaTime);

}

// D3Q: frame callback: whenever the window size changed, this callback is called
function framebufferSizeCallback(width: number, height: number) {
    // make sure the viewport matches the new window dimensions; note that width and 
    // height will be significantly larger than specified on retina displays.
    canvas.width = width; canvas.height = height;
    gl.viewport(0, 0, width, height);
    requestAnimationFrame(render);
}

// D3Q: mouse callback: whenever the mouse moves, this callback is called
function mouseMoveCallback(xoffset: number, yoffset: number, buttonID: number) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}

// D3Q: mouse callback: whenever the mouse scroll wheel scrolls, this callback is called
function mouseScrollCallback(yoffset: number) {
    camera.ProcessMouseScroll(yoffset);
}
