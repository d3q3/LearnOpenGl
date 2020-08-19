import { vs_materials, fs_materials } from "../../js/Ch21/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { GltfLoader } from "../../js/geometry/GltfLoader.js";
import { GltfModel } from "../geometry/GltfModel.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let glMesh;
let cubeVAO;
let lightVAO;
let lightingShader;
let cubePositions;
let keyInput;
let mouse;
let lightPos = vec3.fromValues(0.5, 0.7, 6.0);
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
    let gltfUrl = "../../models/cyborg/cyborg.gltf";
    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res) => resourcesLoaded(res)).catch(error => alert(error.message));
}();
function resourcesLoaded(res) {
    let model = new GltfModel(res, false);
    let meshes = model.getMeshes();
    if (meshes.length > 0)
        glMesh = createGlDrawable(model, meshes[0]);
    afterLoad();
}
class GlMesh {
    constructor() {
        this.vaos = [];
        this.vos = [];
    }
}
function createGlDrawable(model, mesh) {
    let vbos = new Array(model.bufferViews.length);
    let glMesh = new GlMesh();
    glMesh.vos = mesh.vertexObjects;
    for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
        let vo = mesh.vertexObjects[j];
        let mat = vo.materialId;
        let layout = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };
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
    lightingShader = new Shader(gl, vs_materials, fs_materials);
    requestAnimationFrame(render);
}
function render() {
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);
    let lightColor = vec3.create();
    lightColor[0] = 0.5;
    lightColor[1] = 0.5;
    lightColor[2] = 0.5;
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.5, 0.5, 0.5));
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.2, 0.2, 0.2));
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 0.8, 0.8, 0.8);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 8.0);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);
    let model = mat4.create();
    mat4.translate(model, model, vec3.fromValues(0, -1.5, 0));
    setMat4vShader(lightingShader, "model", model);
    for (let j = 0; j < glMesh.vaos.length; j++) {
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
function componentProduct3(a, b) {
    return vec3.fromValues(a[0] * b[0], a[1] * b[1], a[2] * b[2]);
}
//# sourceMappingURL=load_gltf_mesh.js.map