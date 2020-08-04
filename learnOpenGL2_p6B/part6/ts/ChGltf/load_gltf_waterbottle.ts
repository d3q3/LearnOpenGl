import { vs_pbr, fs_pbr } from "../../js/ChGltf/shaders/1/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/shader.js";
import { Camera, CameraMovement } from "../../js/common/camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { Accessor } from "../../js/geometry/VertexObjects.js";
import { GltfLoader, GltfResource } from "../../js/geometry/GltfLoader.js";
import { GltfModel, GltfMesh, GltfVertexObject } from "../geometry/GltfModel.js";
import { GltfMaterial, GltfTexture } from "../geometry/GltfMaterial.js";

// settings
//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';
const TEXUNIT_ALBEDO = 0, TEXUNIT_NORMAL = 1, TEXUNIT_PBR = 2;

// camera
let camera: Camera;

// timing
let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let glMesh: GlMesh;
let gltfModel: GltfModel;
let model: mat4 = mat4.create();

let glTextures: WebGLTexture[];

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

    // lighting info
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

    camera = new Camera(vec3.fromValues(0.0, 0.0, 1.0), vec3.fromValues(0.0, 1.0, 0.0));

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

function createGlTexture2D(gl, texture: GltfTexture) {
    let glTexture: WebGLTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,  // assumed
        0,        // Level of details
        gl.RGBA, // Format
        gl.RGBA,
        gl.UNSIGNED_BYTE, // Size of each channel
        texture.source
    );
    if (texture.sampler) {
        let sampler = texture.sampler;
        if (sampler.minFilter) {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
        } else {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        }
        if (sampler.magFilter) {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
        } else {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        }
        gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, sampler.wrapS);
        gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, sampler.wrapT);
    }
    else {
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
    return glTexture;
};

function resourcesLoaded(res: GltfResource): void {
    gltfModel = new GltfModel(res, true);
    let meshes = gltfModel.getMeshes();

    glTextures = new Array(gltfModel.textures.length);
    for (let i = 0; i < gltfModel.textures.length; i++) {
        glTextures[i] = createGlTexture2D(gl, gltfModel.textures[i]);
    }

    bottleShader = new Shader(gl, vs_pbr, fs_pbr);
    bottleShader.use(gl);

    bottleShader.setInt(gl, "albedoMap", TEXUNIT_ALBEDO);
    bottleShader.setInt(gl, "normalMap", TEXUNIT_NORMAL);
    bottleShader.setInt(gl, "occlusionMetallicRoughnessMap", TEXUNIT_PBR);

    if (meshes.length > 0)
        glMesh = createGlDrawable(gltfModel, meshes[0]);
    afterLoad();
}

/**
 * a GltfMesh has 0 or more 'primitives'/vertexObjects
 * for every vertexObject an OpenGL vao is created.
 * In vos we keep the original vertexObjects. They contain the information
 * to access the GltfBufferViews.
 */
class GlMesh {
    vaos = [];
    vos: GltfVertexObject[] = [];
    mats: number[] = [];
}

function createGlDrawable(model: GltfModel, mesh: GltfMesh) {

    // vbos: Gl vertex buffers of model
    let vbos: WebGLBuffer[] = new Array(model.bufferViews.length);

    // create Gl Mesh
    let glMesh = new GlMesh();
    glMesh.vos = mesh.vertexObjects;

    for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
        let vo = mesh.vertexObjects[j];

        glMesh.mats.push(vo.materialId);

        // layout in out shader program, see file vs_pbr.js
        let layout = { POSITION: 0, NORMAL: 2, TEXCOORD_0: 1 };

        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        // indexBuffer
        let ib = vo.indexAccessor.bufferId;
        if (!vbos[ib]) {
            const ebo: WebGLBuffer = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);

            vbos[ib] = ebo;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbos[ib]);

        // vertexBuffer(s)
        let acc: Accessor;
        // POSITION
        acc = vo.accessors[vo.attributes.POSITION];
        createGlVertexBuffer(vbos, model, acc);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT,
            false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.POSITION);

        // TEXTURE
        if (layout.TEXCOORD_0 !== undefined) {
            if (vo.attributes.TEXCOORD_0 !== undefined) {
                acc = vo.accessors[vo.attributes.TEXCOORD_0];
                createGlVertexBuffer(vbos, model, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
                gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT,
                    false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.TEXCOORD_0);
            }
        }
        // NORMAL
        if (layout.NORMAL !== undefined) {
            if (vo.attributes.NORMAL !== undefined) {
                acc = vo.accessors[vo.attributes.NORMAL];
                createGlVertexBuffer(vbos, model, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
                acc = vo.accessors[vo.attributes.NORMAL];
                gl.vertexAttribPointer(layout.NORMAL, acc.countComponent,
                    gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.NORMAL);
            }
        }
        glMesh.vaos.push(vao);
    }
    return glMesh;
}

/**
 * creates the vbo if necessary.
 * @param model for bufferviews
 * @param acc the accessorfor the bufferview
 */
function createGlVertexBuffer(vbos: WebGLBuffer[], model: GltfModel, acc: Accessor) {
    let ib = acc.bufferId;
    if (!vbos[ib]) {
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);
        vbos[ib] = vbo;
    }
}

function afterLoad() {
    // configure global opengl state
    // -----------------------------
    gl.enable(gl.DEPTH_TEST);

    requestAnimationFrame(render);
}

// render loop
function render() {
    // per-frame time logic
    // --------------------
    let currentFrame = performance.now() / 1000;

    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;

    // input
    // -----
    processInput();

    // render
    // ------
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
    for (let j = 0; j < glMesh.vaos.length; j++) {
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_ALBEDO);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].pbrMetallicRoughness.baseColorTexture.index]);
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].normalTexture.index]);
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_PBR);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].pbrMetallicRoughness.metallicRoughnessTexture.index]);

        gl.bindVertexArray(glMesh.vaos[j]);
        gl.drawElements(gl.TRIANGLES, glMesh.vos[j].indexAccessor.countElements,
            gl.UNSIGNED_SHORT, glMesh.vos[j].indexAccessor.byteOffset);
    }

    requestAnimationFrame(render);
}

// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
function processInput() {
    // if (gl.fwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
    //     gl.fwSetWindowShouldClose(window, true);
    // if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
    //     glfwSetWindowShouldClose(window, true);

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
