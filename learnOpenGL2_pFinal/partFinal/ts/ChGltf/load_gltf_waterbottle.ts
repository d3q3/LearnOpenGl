import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { PbrShader } from "../../js/gl/shaders/PbrShader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";

import { GltfLoader, GltfResource } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
import { GltfMaterial } from "../geometry/GltfMaterial.js";

import { DrawModel } from "../../js/geometry/Drawable.js";
import { GlManager, GlDrawObject, GlDrawModel } from "../../js/gl/GlDrawable.js";

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
let model: mat4 = mat4.create();
let scale = 1.0; //with model 2CylinderEngine: scale = 0.001
mat4.scale(model, model, [scale, scale, scale]);

class GlLightedModel {
    glDrawModel: GlDrawModel;

    constructor(glDrawModel: GlDrawModel) {
        this.glDrawModel = glDrawModel;
    }

    drawModelObjects() {
        for (let i = 0; i < this.glDrawModel.glDrawMeshes.length; i++) {
            let glMesh = this.glDrawModel.glDrawMeshes[i];
            for (let j = 0; j < glMesh.glDrawObjects.length; j++) {
                let glObject: GlDrawObject = glMesh.glDrawObjects[j];
                if (glObject.material.type = "pbr0") {
                    let material: GltfMaterial = (glObject.material) as GltfMaterial;
                    let shader: PbrShader = (glObject.shader) as PbrShader;
                    shader.setMaterial(gl, material, this.glDrawModel.glTextures);

                    gl.bindVertexArray(glMesh.glDrawObjects[j].vao);
                    gl.drawElements(gl.TRIANGLES, glMesh.glDrawObjects[j].indexAccessor.countElements,
                        gl.UNSIGNED_SHORT, glMesh.glDrawObjects[j].indexAccessor.byteOffset);
                }
            }
        }
    }
}

let bottleModel: DrawModel;
let glBottleModel: GlLightedModel;

let keyInput: KeyInput;
let mouse: Mouse;

// lighting: 4 intense white lamps
let lightPositions: Float32Array;
let lightColors: Float32Array;

let main = function () {
    // canvas creation and initializing OpenGL context 
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
    //let gltfUrl = "../../models/2CylinderEngine/glTF/2CylinderEngine.gltf";
    let gltfUrl = "../../models/WaterBottle/glTF/WaterBottle.gltf";
    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res: GltfResource) => resourcesLoaded(res)).catch(error => alert(error.message));
}();

function resourcesLoaded(res: GltfResource): void {
    bottleModel = new GltfModel(res, true);
    bottleModel.drawMeshes = bottleModel.getMeshes();

    glManager = new GlManager(gl);
    glBottleModel = new GlLightedModel(glManager.createGlDrawModel(bottleModel));
    bottleShader = glManager.getShader("pbr0") as PbrShader;

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

    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // D3Q: update the shaders used in the models
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


    // D3Q: render the model
    glBottleModel.drawModelObjects();
    requestAnimationFrame(render);
}

// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
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

// glfw: whenever the window size changed (by OS or user resize) this callback function executes
// ---------------------------------------------------------------------------------------------
function framebufferSizeCallback(width: number, height: number) {
    // make sure the viewport matches the new window dimensions; note that width and 
    // height will be significantly larger than specified on retina displays.
    canvas.width = width; canvas.height = height;
    gl.viewport(0, 0, width, height);
    requestAnimationFrame(render);
}

// glfw: whenever the mouse moves, this callback is called
// D3Q: mouse callback: whenever the mouse moves, this callback is called
function mouseMoveCallback(xoffset: number, yoffset: number, buttonID: number) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}

// D3Q: mouse callback: whenever the mouse scroll wheel scrolls, this callback is called
function mouseScrollCallback(yoffset: number) {
    camera.ProcessMouseScroll(yoffset);
}
