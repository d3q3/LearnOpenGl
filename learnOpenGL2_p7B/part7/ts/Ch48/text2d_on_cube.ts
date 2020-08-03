import { vs_text_cube, fs_text_cube } from "../../js/Ch48/shaders/index.js";
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
let canvasText: HTMLCanvasElement;

let gl: WebGL2RenderingContext;
let ctx: CanvasRenderingContext2D;

let cubeVAO: WebGLVertexArrayObject;

let textCubeShader: Shader;
let textCubeTexture;

let keyInput: KeyInput;
let mouse: Mouse;

// lighting
let lightPos = vec3.fromValues(0.0, 0.7, 2.0);


let main = function () {
    // canvas getting from document and initializing OpenGL context 
    canvas = document.querySelector('#canvas1');

    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed"); return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight) }

    // create canvas with text
    canvasText = document.createElement('canvas');
    canvasText.width = 1024;
    canvasText.height = 1024;
    ctx = canvasText.getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    ctx.fillStyle = "blue";
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.font = "180px Comic Sans MS";
    ctx.fillStyle = "red";
    let txt = "HELLUP!"
    const textMetrics = ctx.measureText(txt);

    ctx.textAlign = "left";
    ctx.fillText(txt, 10, 160);
    textCubeTexture = createCanvasTexture(canvasText);

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
    textCubeShader = new Shader(gl, vs_text_cube, fs_text_cube);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    let vertices = new Float32Array([
        // back face
        - 0.5, -0.5, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, // bottom-left
        0.5, 0.5, -0.5, 0.0, 0.0, -0.5, 1.0, 1.0, // top-right
        0.5, -0.5, -0.5, 0.0, 0.0, -0.5, 1.0, 0.0, // bottom-right         
        0.5, 0.5, -0.5, 0.0, 0.0, -0.5, 1.0, 1.0, // top-right
        -0.5, -0.5, -0.5, 0.0, 0.0, -0.5, 0.0, 0.0, // bottom-left
        -0.5, 0.5, -0.5, 0.0, 0.0, -0.5, 0.0, 1.0, // top-left
        // front face
        -0.5, -0.5, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, // bottom-left
        0.5, -0.5, 0.5, 0.0, 0.0, 0.5, 1.0, 0.0, // bottom-right
        0.5, 0.5, 0.5, 0.0, 0.0, 0.5, 1.0, 1.0, // top-right
        0.5, 0.5, 0.5, 0.0, 0.0, 0.5, 1.0, 1.0, // top-right
        -0.5, 0.5, 0.5, 0.0, 0.0, 0.5, 0.0, 1.0, // top-left
        -0.5, -0.5, 0.5, 0.0, 0.0, 0.5, 0.0, 0.0, // bottom-left
        // left face
        -0.5, 0.5, 0.5, -0.5, 0.0, 0.0, 1.0, 0.0, // top-right
        -0.5, 0.5, -0.5, -0.5, 0.0, 0.0, 1.0, 1.0, // top-left
        -0.5, -0.5, -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, // bottom-left
        -0.5, -0.5, -0.5, -0.5, 0.0, 0.0, 0.0, 1.0, // bottom-left
        -0.5, -0.5, 0.5, -0.5, 0.0, 0.0, 0.0, 0.0, // bottom-right
        -0.5, 0.5, 0.5, -0.5, 0.0, 0.0, 1.0, 0.0, // top-right
        // right face
        0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, // top-left
        0.5, -0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 1.0, // bottom-right
        0.5, 0.5, -0.5, 0.5, 0.0, 0.0, 1.0, 1.0, // top-right         
        0.5, -0.5, -0.5, 0.5, 0.0, 0.0, 0.0, 1.0, // bottom-right
        0.5, 0.5, 0.5, 0.5, 0.0, 0.0, 1.0, 0.0, // top-left
        0.5, -0.5, 0.5, 0.5, 0.0, 0.0, 0.0, 0.0, // bottom-left     
        // bottom face
        -0.5, -0.5, -0.5, 0.0, -0.5, 0.0, 0.0, 1.0, // top-right
        0.5, -0.5, -0.5, 0.0, -0.5, 0.0, 1.0, 1.0, // top-left
        0.5, -0.5, 0.5, 0.0, -0.5, 0.0, 1.0, 0.0, // bottom-left
        0.5, -0.5, 0.5, 0.0, -0.5, 0.0, 1.0, 0.0, // bottom-left
        -0.5, -0.5, 0.5, 0.0, -0.5, 0.0, 0.0, 0.0, // bottom-right
        -0.5, -0.5, -0.5, 0.0, -0.5, 0.0, 0.0, 1.0, // top-right
        // top face
        -0.5, 0.5, -0.5, 0.0, 0.5, 0.0, 0.0, 1.0, // top-left
        0.5, 0.5, 0.5, 0.0, 0.5, 0.0, 1.0, 0.0, // bottom-right
        0.5, 0.5, -0.5, 0.0, 0.5, 0.0, 1.0, 1.0, // top-right     
        0.5, 0.5, 0.5, 0.0, 0.5, 0.0, 1.0, 0.0, // bottom-right
        -0.5, 0.5, -0.5, 0.0, 0.5, 0.0, 0.0, 1.0, // top-left
        -0.5, 0.5, 0.5, 0.0, 0.5, 0.0, 0.0, 0.0  // bottom-left        
    ]);

    // first, configure the cube's VAO (and VBO)
    cubeVAO = gl.createVertexArray();
    let VBO = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.bindVertexArray(cubeVAO);

    // position attribute
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    // normal attribute
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);
    // texture attribute
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
    gl.enableVertexAttribArray(2);

    textCubeShader.use(gl);
    gl.bindTexture(gl.TEXTURE_2D, textCubeTexture);

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
    textCubeShader.use(gl);

    setVec3vShader(textCubeShader, "light.position", lightPos);
    setVec3vShader(textCubeShader, "viewPos", camera.Position);

    // light properties
    let lightColor = vec3.create();
    lightColor[0] = 1.0;
    lightColor[1] = 1.0;
    lightColor[2] = 1.0;
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.5, 0.5, 0.5));
    setVec3vShader(textCubeShader, "light.diffuse", diffuseColor);

    // material properties
    gl.bindTexture(gl.TEXTURE_2D, textCubeTexture);
    textCubeShader.setInt(gl, "material.diffuse", 0);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    setMat4vShader(textCubeShader, "projection", projection);
    setMat4vShader(textCubeShader, "view", view);

    // world transformation
    let model: mat4 = mat4.create();
    mat4.rotate(model, model, 35 * Math.PI / 180, vec3.fromValues(-0.2, 0.9, 0));
    setMat4vShader(textCubeShader, "model", model);

    // render the cube
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);

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

function WorldToPx(point: vec4, MVPmatrix: mat4, canvas) {
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

    return px;
}

function createCanvasTexture(canvas2d) {
    let texture = gl.createTexture();

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas2d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);

    gl.bindTexture(gl.TEXTURE_2D, null);
    return texture;
}