import { vs_materials, fs_materials, vs_lamp, fs_lamp } from "../../js/Ch48/shaders/index.js";
import { vec3, vec4, mat4, vec2 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";


// settings
const sizeFloat = 4;
//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';


// camera
let camera: Camera;

// timing
let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let cubeVAO: WebGLVertexArrayObject;
//let lightVAO: WebGLVertexArrayObject;
let lightingShader: Shader;
//let lampShader: Shader;
let keyInput: KeyInput;
let mouse: Mouse;
let divA, PointA;
let divB, PointB;
let divC, PointC;
let divD, PointD;
let divE, PointE;
let divF, PointF;


// lighting
let lightPos = vec3.fromValues(0.5, 0.7, 2.0);


let main = function () {
    // canvas getting from document and initializing OpenGL context 
    canvas = document.querySelector('#canvas1');

    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed"); return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight) }

    let containerElement = document.querySelector("#container1")
    // create the text divs
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

    // D3Q: process all mouse input using callbacks
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;


    // configure global opengl state
    // -----------------------------
    gl.enable(gl.DEPTH_TEST);

    // build and compile our shader zprogram
    // ------------------------------------
    lightingShader = new Shader(gl, vs_materials, fs_materials);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
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

    // first, configure the cube's VAO (and VBO)
    cubeVAO = gl.createVertexArray();
    let VBO = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindVertexArray(cubeVAO);

    // position attribute
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    // normal attribute
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);

    requestAnimationFrame(render);
}();

// render loop
function render() {
    // per-frame time logic
    // --------------------
    let currentFrame = performance.now() / 2000;

    deltaTime = (currentFrame - lastFrame) * 500;
    lastFrame = currentFrame;

    // input
    // -----
    processInput();

    // render
    // ------
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // be sure to activate shader when setting uniforms/drawing objects
    lightingShader.use(gl);
    //lightingShader.setVec3("light.position", lightPos);
    setVec3vShader(lightingShader, "light.position", lightPos);
    //lightingShader.setVec3("viewPos", camera.Position);
    setVec3vShader(lightingShader, "viewPos", camera.Position);

    // light properties
    let lightColor = vec3.create();
    lightColor[0] = Math.sin(currentFrame * 2.0);
    lightColor[1] = Math.sin(currentFrame * 0.7);
    lightColor[2] = Math.sin(currentFrame * 1.3);
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.5, 0.5, 0.5)); // decrease the influence
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.2, 0.2, 0.2)); // low influence
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);

    // material properties
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 32.0);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);

    // world transformation
    let model: mat4 = mat4.create();
    mat4.rotate(model, model, 20 * Math.PI / 180, vec3.fromValues(-0.2, 0.9, 0));
    setMat4vShader(lightingShader, "model", model);

    // render the cube
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

    // render the text divs
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

function componentProduct3(a: vec3, b: vec3) {
    return vec3.fromValues(a[0] * b[0], a[1] * b[1], a[2] * b[2]);
}

function createTextDiv(txt) {
    // create a text-div with the css class 'overlay'
    var div = document.createElement("div");
    div.className = "overlay";

    // fill div with text
    var textNode = document.createTextNode(txt);
    div.appendChild(textNode);
    return div;
}

function WorldToPx(textDiv, point: vec4, MVPmatrix: mat4, canvas) {
    // compute clip space position of point
    let clipspace = vec4.create();
    vec4.transformMat4(clipspace, point, MVPmatrix);

    // divide X and Y by W
    clipspace[0] /= clipspace[3];
    clipspace[1] /= clipspace[3];

    // convert from clipspace to pixels
    let px = vec2.fromValues(
        (clipspace[0] * 0.5 + 0.5) * gl.canvas.width,
        (clipspace[1] * -0.5 + 0.5) * gl.canvas.height
    );
    // set position of text-div
    textDiv.style.left = Math.floor(px[0]) + "px";
    textDiv.style.top = Math.floor(px[1]) + "px";
}