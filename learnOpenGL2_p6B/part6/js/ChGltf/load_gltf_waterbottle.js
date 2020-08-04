import { vs_pbr, fs_pbr } from "../../js/ChGltf/shaders/1/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/shader.js";
import { Camera, CameraMovement } from "../../js/common/camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { GltfLoader } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
const TEXUNIT_ALBEDO = 0, TEXUNIT_NORMAL = 1, TEXUNIT_PBR = 2;
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let glMesh;
let gltfModel;
let model = mat4.create();
let glTextures;
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
    camera = new Camera(vec3.fromValues(0.0, 0.0, 1.0), vec3.fromValues(0.0, 1.0, 0.0));
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
function createGlTexture2D(gl, texture) {
    let glTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, glTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.source);
    if (texture.sampler) {
        let sampler = texture.sampler;
        if (sampler.minFilter) {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, sampler.minFilter);
        }
        else {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST_MIPMAP_LINEAR);
        }
        if (sampler.magFilter) {
            gl.samplerParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, sampler.magFilter);
        }
        else {
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
}
;
function resourcesLoaded(res) {
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
class GlMesh {
    constructor() {
        this.vaos = [];
        this.vos = [];
        this.mats = [];
    }
}
function createGlDrawable(model, mesh) {
    let vbos = new Array(model.bufferViews.length);
    let glMesh = new GlMesh();
    glMesh.vos = mesh.vertexObjects;
    for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
        let vo = mesh.vertexObjects[j];
        glMesh.mats.push(vo.materialId);
        let layout = { POSITION: 0, NORMAL: 2, TEXCOORD_0: 1 };
        let vao = gl.createVertexArray();
        gl.bindVertexArray(vao);
        let ib = vo.indexAccessor.bufferId;
        if (!vbos[ib]) {
            const ebo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);
            vbos[ib] = ebo;
        }
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, vbos[ib]);
        let acc;
        acc = vo.accessors[vo.attributes.POSITION];
        createGlVertexBuffer(vbos, model, acc);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.POSITION);
        if (layout.TEXCOORD_0 !== undefined) {
            if (vo.attributes.TEXCOORD_0 !== undefined) {
                acc = vo.accessors[vo.attributes.TEXCOORD_0];
                createGlVertexBuffer(vbos, model, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
                gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.TEXCOORD_0);
            }
        }
        if (layout.NORMAL !== undefined) {
            if (vo.attributes.NORMAL !== undefined) {
                acc = vo.accessors[vo.attributes.NORMAL];
                createGlVertexBuffer(vbos, model, acc);
                gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
                acc = vo.accessors[vo.attributes.NORMAL];
                gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
                gl.enableVertexAttribArray(layout.NORMAL);
            }
        }
        glMesh.vaos.push(vao);
    }
    return glMesh;
}
function createGlVertexBuffer(vbos, model, acc) {
    let ib = acc.bufferId;
    if (!vbos[ib]) {
        let vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);
        vbos[ib] = vbo;
    }
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
    for (let j = 0; j < glMesh.vaos.length; j++) {
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_ALBEDO);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].pbrMetallicRoughness.baseColorTexture.index]);
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_NORMAL);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].normalTexture.index]);
        gl.activeTexture(gl.TEXTURE0 + TEXUNIT_PBR);
        gl.bindTexture(gl.TEXTURE_2D, glTextures[gltfModel.materials[glMesh.mats[j]].pbrMetallicRoughness.metallicRoughnessTexture.index]);
        gl.bindVertexArray(glMesh.vaos[j]);
        gl.drawElements(gl.TRIANGLES, glMesh.vos[j].indexAccessor.countElements, gl.UNSIGNED_SHORT, glMesh.vos[j].indexAccessor.byteOffset);
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