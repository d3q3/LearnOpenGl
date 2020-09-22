import { vec3, mat3, mat4 } from "../../../math/glmatrix/index.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";

import { EnvShader } from "../../js/gl/shaders/Env0Shader.js";
import { ImageLoader } from "../../js/filing/imageLoader.js"
import { DrawCubeMap } from "../../js/geometry/Drawable.js";
import { GlManager, GlDrawCubeMapObject } from "../../js/gl/GlDrawable.js";
import { Texture, CubeMapMaterial } from "../../js/material/Material.js";

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';

// camera
let camera: Camera;

// timing
let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// D3Q: global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let glManager: GlManager;
let glCubeMap: GlDrawCubeMapObject;

let envShader: EnvShader;

let keyInput: KeyInput;
let mouse: Mouse;

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

    camera = new Camera(vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0));

    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });

    // D3Q: process all mouse input using callbacks
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;

    // D3Q: load our environment; names in OpenGl order of GL_TEXTURE_CUBE_MAP_xxx
    let imageUrls = ["Right.png", "Left.png", "Top.png", "Bottom.png", "Back.png", "Front.png"];
    //let imageUrls = ["right.jpg", "left.jpg", "top.jpg", "bottom.jpg", "back.jpg", "front.jpg"];
    //let imageUrls = ["posx.jpg", "negx.jpg", "posy.jpg", "negy.jpg", "posz.jpg", "negz.jpg"];
    let imageLoader: ImageLoader = new ImageLoader("../../textures/environment/");
    let promImages = imageLoader.load(imageUrls);
    promImages.then((images: HTMLImageElement[]) => resourcesLoaded(images)).catch(error => alert(error));
}();

function resourcesLoaded(sources: HTMLImageElement[]): void {
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

    afterLoad();
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

    // render
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // D3Q: update the shaders used in the model(s)
    envShader.use();

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, 90 * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    envShader.setProjection(projection);
    envShader.center(true);
    envShader.setView(view);

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

