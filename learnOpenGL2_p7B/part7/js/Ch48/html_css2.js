import { vs_materials, fs_materials } from "../../js/Ch48/shaders/index.js";
import { vec3, vec4, mat4, vec2 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
const sizeFloat = 4;
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let camera;
let deltaTime = 0.0;
let lastFrame = 0.0;
let canvas;
let gl;
let cubeVAO;
let lightingShader;
let keyInput;
let mouse;
let divA, PointA;
let divB, PointB;
let divC, PointC;
let divD, PointD;
let divE, PointE;
let divF, PointF;
let lightPos = vec3.fromValues(0.5, 0.7, 2.0);
let main = function () {
    canvas = document.querySelector('#canvas1');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed");
        return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight); };
    let containerElement = document.querySelector("#container1");
    divA = createTextDiv("A");
    divB = createTextDiv("B");
    divC = createTextDiv("C");
    divD = createTextDiv("D");
    divE = createTextDiv("E");
    divF = createTextDiv("F");
    containerElement.appendChild(divA);
    containerElement.appendChild(divB);
    containerElement.appendChild(divC);
    containerElement.appendChild(divD);
    containerElement.appendChild(divE);
    containerElement.appendChild(divF);
    PointA = vec4.fromValues(-0.6, -0.5, 0.5, 1.0);
    PointB = vec4.fromValues(0.6, -0.5, 0.5, 1.0);
    PointC = vec4.fromValues(0.6, 0.5, 0.5, 1.0);
    PointD = vec4.fromValues(-0.6, 0.5, 0.5, 1.0);
    PointE = vec4.fromValues(-0.6, 0.5, -0.5, 1.0);
    PointF = vec4.fromValues(-0.6, -0.5, -0.5, 1.0);
    camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));
    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;
    gl.enable(gl.DEPTH_TEST);
    lightingShader = new Shader(gl, vs_materials, fs_materials);
    let vertices = new Float32Array([
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, -0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        -0.5, 0.5, -0.5, 0.0, 0.0, -1.0,
        -0.5, -0.5, -0.5, 0.0, 0.0, -1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        -0.5, 0.5, 0.5, 0.0, 0.0, 1.0,
        -0.5, -0.5, 0.5, 0.0, 0.0, 1.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0,
        -0.5, 0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, -1.0, 0.0, 0.0,
        -0.5, -0.5, 0.5, -1.0, 0.0, 0.0,
        -0.5, 0.5, 0.5, -1.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0,
        0.5, 0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, -0.5, 1.0, 0.0, 0.0,
        0.5, -0.5, 0.5, 1.0, 0.0, 0.0,
        0.5, 0.5, 0.5, 1.0, 0.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, -0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        -0.5, -0.5, 0.5, 0.0, -1.0, 0.0,
        -0.5, -0.5, -0.5, 0.0, -1.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, -0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        -0.5, 0.5, 0.5, 0.0, 1.0, 0.0,
        -0.5, 0.5, -0.5, 0.0, 1.0, 0.0
    ]);
    cubeVAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.bindVertexArray(cubeVAO);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);
    requestAnimationFrame(render);
}();
function render() {
    let currentFrame = performance.now() / 2000;
    deltaTime = (currentFrame - lastFrame) * 500;
    lastFrame = currentFrame;
    processInput();
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);
    let lightColor = vec3.create();
    lightColor[0] = Math.sin(currentFrame * 2.0);
    lightColor[1] = Math.sin(currentFrame * 0.7);
    lightColor[2] = Math.sin(currentFrame * 1.3);
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.5, 0.5, 0.5));
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.2, 0.2, 0.2));
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 32.0);
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);
    let model = mat4.create();
    mat4.rotate(model, model, 20 * Math.PI / 180, vec3.fromValues(-0.2, 0.9, 0));
    setMat4vShader(lightingShader, "model", model);
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    let MVPmatrix = model;
    MVPmatrix = mat4.multiply(MVPmatrix, view, MVPmatrix);
    MVPmatrix = mat4.multiply(MVPmatrix, projection, MVPmatrix);
    WorldToPx(divA, PointA, MVPmatrix, canvas);
    WorldToPx(divB, PointB, MVPmatrix, canvas);
    WorldToPx(divC, PointC, MVPmatrix, canvas);
    WorldToPx(divE, PointE, MVPmatrix, canvas);
    WorldToPx(divD, PointD, MVPmatrix, canvas);
    WorldToPx(divF, PointF, MVPmatrix, canvas);
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
function createTextDiv(txt) {
    var div = document.createElement("div");
    div.className = "overlay";
    var textNode = document.createTextNode(txt);
    div.appendChild(textNode);
    return div;
}
function WorldToPx(textDiv, point, MVPmatrix, canvas) {
    let clipspace = vec4.create();
    vec4.transformMat4(clipspace, point, MVPmatrix);
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];
    let px = vec2.fromValues((clipspace[0] * 0.5 + 0.5) * gl.canvas.width, (clipspace[1] * -0.5 + 0.5) * gl.canvas.height);
    textDiv.style.left = Math.floor(px[0]) + "px";
    textDiv.style.top = Math.floor(px[1]) + "px";
}
//# sourceMappingURL=html_css2.js.map