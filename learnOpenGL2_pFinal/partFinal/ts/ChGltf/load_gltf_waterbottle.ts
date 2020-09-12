import { vs_pbr, fs_pbr } from "../../js/ChGltf/shaders/1/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/material/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";

import { GltfLoader, GltfResource } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
import { GltfMaterial } from "../geometry/GltfMaterial.js";

import { DrawMesh, DrawModel } from "../../js/geometry/Drawable.js";
import { GlManager, GlDrawMesh, GlDrawModel } from "../../js/gl/GlDrawable.js";

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';
const TEXUNIT_ALBEDO = 0, TEXUNIT_NORMAL = 1, TEXUNIT_PBR = 2;

// camera
let camera: Camera;

// timing
let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// D3Q: global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let glManager: GlManager;
let bottleModel: DrawModel;
let glBottleModel: GlDrawModel;

let model: mat4 = mat4.create();

let bottleShader: Shader;

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

    // load our mesh
    let gltfUrl = "../../models/WaterBottle/glTF/WaterBottle.gltf";
    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res: GltfResource) => resourcesLoaded(res)).catch(error => alert(error.message));
}();

function resourcesLoaded(res: GltfResource): void {
    bottleModel = new GltfModel(res, true);
    bottleModel.drawMeshes = bottleModel.getMeshes();

    glManager = new GlManager(gl);
    glManager.setBufferCount(bottleModel.bufferCount);
    glManager.setTextureCount(bottleModel.textureCount);
    //    let attributes = { POSITION: 0, NORMAL: 2, TEXCOORD_0: 1 };
    //    glManager.setAttributeLayout(attributes);
    glBottleModel = glManager.createGlModel(bottleModel);

    //load the only mesh in this model
    // let drawMesh: DrawMesh = drawModel.drawMeshes[0];
    // glMesh = glManager.createGlDrawMesh(drawMesh);

    //set the glTextures found in the drawModel
    //    glManager.setModelTextures(drawModel);

    bottleShader = new Shader(gl, vs_pbr, fs_pbr);
    bottleShader.use(gl);

    bottleShader.setInt(gl, "albedoMap", TEXUNIT_ALBEDO);
    bottleShader.setInt(gl, "normalMap", TEXUNIT_NORMAL);
    bottleShader.setInt(gl, "occlusionMetallicRoughnessMap", TEXUNIT_PBR);

    afterLoad();
}


function afterLoad() {
    // configure global opengl state
    gl.enable(gl.DEPTH_TEST);

    requestAnimationFrame(render);
}

// D3Q: render loop
function render() {
    // per-frame time logic
    let currentFrame = performance.now() / 1000;

    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;

    // input
    processInput();

    // render
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // be sure to activate shader when setting uniforms/drawing objects
    bottleShader.use(gl);
    gl.uniform3fv(gl.getUniformLocation(bottleShader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(bottleShader.programId, "lightColors"), lightColors);

    setVec3vShader(bottleShader, "camPos", camera.Position);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    setMat4vShader(bottleShader, "projection", projection);
    setMat4vShader(bottleShader, "view", view);

    // world transformation, rotate model
    mat4.rotateY(model, model, deltaTime / 1000);
    setMat4vShader(bottleShader, "model", model);

    // render the gltf model
    for (let i = 0; i < glBottleModel.glDrawMeshes.length; i++) {
        let glMesh = glBottleModel.glDrawMeshes[i];
        for (let j = 0; j < glMesh.glDrawObjects.length; j++) {

            if (glMesh.glDrawObjects[j].material.type = "gltf") {
                let material: GltfMaterial = glMesh.glDrawObjects[j].material as GltfMaterial;
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_ALBEDO);
                gl.bindTexture(gl.TEXTURE_2D, glManager.glTextures[material.attributes.ALBEDO]);
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
                gl.bindTexture(gl.TEXTURE_2D, glManager.glTextures[material.attributes.NORMAL]);
                gl.activeTexture(gl.TEXTURE0 + TEXUNIT_PBR);
                gl.bindTexture(gl.TEXTURE_2D, glManager.glTextures[material.attributes.PBR]);

                gl.bindVertexArray(glMesh.glDrawObjects[j].vao);
                gl.drawElements(gl.TRIANGLES, glMesh.glDrawObjects[j].indexAccessor.countElements,
                    gl.UNSIGNED_SHORT, glMesh.glDrawObjects[j].indexAccessor.byteOffset);
            }
        }
    }

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

//D3Q: a few utility functions
function setVec3vShader(shader: Shader, uniformName: string, value: vec3) {
    gl.uniform3fv(gl.getUniformLocation(shader.programId, uniformName), value);
}

function setMat4vShader(shader: Shader, uniformName: string, value: mat4) {
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, uniformName), false, value);
}
