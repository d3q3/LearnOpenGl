import { vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import {
    fs_bloom, vs_bloom, fs_lightBox, fs_blur, vs_blur,
    vs_bloomFinal, fs_bloomFinal
} from '../../js/Ch40/shaders/index.js'
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';


// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

/**
 * D3Q: javascript version of Ch40 program in LearnOpenGL
 * rewrite of bloom.cpp.
 * 
 * To implement Bloom we render a lighted scene as usual and extract both the scene’s 
 * HDR colorbuffer and an image of the scene with only its bright regions visible. 
 * The extracted brightness image is then blurred and the result added on top of the 
 * original HDR scene image.
 * 
 * D3Q:good example for post-processing. We use also a tecnique MRT (Multiple render targets)
 * that is part of WebGL2 (in webGL1 use extension WEBGL_draw_buffers). Also the way to
 * handle a Gaussian blur in two passes using the "pingpong" technique is very nice.
 */


const sizeFloat = 4;

// creating window (canvas) and rendering context (gl)
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

var gl: WebGL2RenderingContext = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}

// settings
let bloom = true;
let bloomKeyPressed = false;
let exposure = 1.0;

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_1 = '1', GLFW_KEY_2 = '2', GLFW_KEY_Q = 'q', GLFW_KEY_E = 'e',
    GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_1, GLFW_KEY_2, GLFW_KEY_Q, GLFW_KEY_E,
    GLFW_KEY_SPACE
});

//D3Q: global variables used in both main() and render()
let shader: Shader = null;
let shaderLight: Shader = null;
let shaderBlur: Shader = null;
let shaderBloomFinal: Shader = null;

let hdrFBO: WebGLFramebuffer;
let colorBuffer0: WebGLTexture, colorBuffer1: WebGLTexture;
let pingpongFBO: WebGLFramebuffer[];
let pingpongColorbuffers: WebGLTexture[];

let woodTexture: WebGLTexture;
let containerTexture: WebGLTexture;
//let colorBufferXX: WebGLTexture = loadTexture("../../textures/awesomeface.png", 4, false);
let projection: mat4 = mat4.create(), view: mat4 = mat4.create(); let model = mat4.create();
let lightPositions: Float32Array = null;
let lightColors: Float32Array = null;
let axis = vec3.create();
let cubeVAO = null;
let quadVAO = null;


// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 5.0), vec3.fromValues(0.0, 1.0, 0.0));

// timing
let deltaTime: number = 0.0;
let lastFrame: number = 0.0;

// D3Q: process all mouse input using callbacks
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;


let main = function () {

    // configure global opengl state
    gl.enable(gl.DEPTH_TEST);

    // build and compile shaders
    shader = new Shader(gl, vs_bloom, fs_bloom);
    shaderLight = new Shader(gl, vs_bloom, fs_lightBox);
    shaderBlur = new Shader(gl, vs_blur, fs_blur);
    shaderBloomFinal = new Shader(gl, vs_bloomFinal, fs_bloomFinal);

    // load textures
    // note that we're loading the texture as an SRGB texture
    woodTexture = loadTexture("../../textures/wood.png", 4, true);
    containerTexture = loadTexture("../../textures/container2.png", 4, true);

    // configure floating point framebuffer
    hdrFBO = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    // create 2 floating point color buffers (1 for normal rendering, 
    // other for brightness treshold values)
    colorBuffer0 = gl.createTexture();
    colorBuffer1 = gl.createTexture();
    for (let i = 0; i < 2; i++) {
        gl.bindTexture(gl.TEXTURE_2D, i == 0 ? colorBuffer0 : colorBuffer1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);  // we clamp to the edge as the blur filter would otherwise sample repeated texture values!
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        // attach texture to framebuffer
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D,
            i == 0 ? colorBuffer0 : colorBuffer1, 0);
    }

    // create and attach depth buffer (renderbuffer)
    let rboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    // attach depth buffer
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);

    // tell OpenGL which color attachments we'll use (of this framebuffer) for rendering 
    let attachments = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1];
    gl.drawBuffers(attachments);

    let check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check != gl.FRAMEBUFFER_COMPLETE)
        console.log("Framebuffer render not complete");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // ping-pong-framebuffer for blurring
    pingpongFBO = [gl.createFramebuffer(), gl.createFramebuffer()];
    // pingpongFBO = new WebGLFramebuffer[2];
    // pingpongFBO[0] = gl.createFramebuffer();
    // pingpongFBO[1] = gl.createFramebuffer();

    pingpongColorbuffers = [gl.createTexture(), gl.createTexture()];
    // pingpongColorbuffers = new WebGLTexture[2];
    // pingpongColorbuffers[0] = gl.createTexture();
    // pingpongColorbuffers[1] = gl.createTexture();
    for (let i = 0; i < 2; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingpongFBO[i]);
        gl.bindTexture(gl.TEXTURE_2D, pingpongColorbuffers[i]);

        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); // we clamp to the edge as the blur filter would otherwise sample repeated texture values!
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, pingpongColorbuffers[i], 0);
        // also check if framebuffers are complete (no need for depth buffer)
        let check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (check != gl.FRAMEBUFFER_COMPLETE)
            console.log("Framebuffer pingpong not complete");
    }

    // lighting info
    lightPositions = new Float32Array([
        0.0, 0.5, 1.5,
        -4.0, 0.5, -3.0,
        3.0, 0.5, 1.0,
        -.8, 2.4, -1.0
    ]);
    lightColors = new Float32Array([
        5.0, 5.0, 5.0,
        10.0, 0.0, 0.0,
        0.0, 0.0, 15.0,
        0.0, 5.0, 0.0
    ]);


    // shader configuration
    // --------------------
    shader.use(gl);
    shader.setInt(gl, "diffuseTexture", 0);
    shaderBlur.use(gl);
    shaderBlur.setInt(gl, "image", 0);
    shaderBloomFinal.use(gl);
    shaderBloomFinal.setInt(gl, "scene", 0);
    shaderBloomFinal.setInt(gl, "bloomBlur", 1);

    animate();
}()

function animate() {
    //updateScene();
    render();
    requestAnimationFrame(animate);
}

//render scene
function render() {
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    processInput();    // render loop

    // input
    // -----
    processInput();

    // render
    gl.clearColor(0.2, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    // 1. render scene into floating point framebuffer
    // -----------------------------------------------
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    view = camera.GetViewMatrix();

    shader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, woodTexture);

    // set light uniforms
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "viewPos"), camera.Position);
    // set lighting uniforms
    //???????????????? In the shader: Light struct!!!!!!!!!!!!!!!!!
    // for (unsigned int i = 0; i < lightPositions.size(); i++)
    // {
    //     shader.setVec3("lights[" + std:: to_string(i) + "].Position", lightPositions[i]);
    //     shader.setVec3("lights[" + std:: to_string(i) + "].Color", lightColors[i]);
    // }
    // shader.setVec3("viewPos", camera.Position);

    // create one large cube that acts as the floor
    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(0.0, -1.0, 0.0));
    model = mat4.scale(model, model, vec3.fromValues(12.5, 0.5, 12.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    // then create multiple cubes as the scenery
    gl.bindTexture(gl.TEXTURE_2D, containerTexture);

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(0.0, 1.5, 0.0));
    model = mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(2.0, 0.0, 1.0));
    model = mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(-1.0, -1.0, 2.0));
    model = mat4.rotate(model, model, (60.0 * Math.PI / 180), vec3.normalize(axis, vec3.fromValues(1.0, 0.0, 1.0)));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(0.0, 2.7, 4.0));
    model = mat4.rotate(model, model, (23.0 * Math.PI / 180), vec3.normalize(axis, vec3.fromValues(1.0, 0.0, 1.0)));
    model = mat4.scale(model, model, vec3.fromValues(1.25, 1.25, 1.25));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(-2.0, 1.0, -3.0));
    model = mat4.rotate(model, model, (124.0 * Math.PI / 180), vec3.normalize(axis, vec3.fromValues(1.0, 0.0, 1.0)));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    mat4.identity(model);
    model = mat4.translate(model, model, vec3.fromValues(-3.0, 0.0, 0.0));
    model = mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderCube();

    // finally show all the light sources as bright cubes
    shaderLight.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderLight.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shaderLight.programId, "view"), false, view);

    for (let i = 0; i < lightPositions.length; i++) {
        mat4.identity(model);
        mat4.translate(model, model, vec3.fromValues(
            lightPositions[3 * i], lightPositions[3 * i + 1], lightPositions[3 * i + 2]));
        mat4.scale(model, model, vec3.fromValues(0.25, 0.25, 0.25));
        gl.uniformMatrix4fv(gl.getUniformLocation(shaderLight.programId, "model"), false, model);
        gl.uniform3f(gl.getUniformLocation(shaderLight.programId, "lightColor"),
            lightColors[3 * i], lightColors[3 * i + 1], lightColors[3 * i + 2]);
        renderCube();
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 2. blur bright fragments with two-pass Gaussian Blur 
    // --------------------------------------------------
    let horizontal = true; let first_iteration = true;
    let amount = 10;
    shaderBlur.use(gl);
    for (let i = 0; i < amount; i++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, pingpongFBO[horizontal ? 1 : 0]);
        shaderBlur.setBoolean(gl, "horizontal", horizontal);
        // bind texture of other framebuffer (or scene if first iteration)
        gl.bindTexture(gl.TEXTURE_2D, first_iteration ?
            colorBuffer1 : pingpongColorbuffers[horizontal ? 0 : 1]);
        renderQuad();
        horizontal = !horizontal;
        if (first_iteration)
            first_iteration = false;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 3. now render floating point color buffer to 2D quad and tonemap HDR colors to default framebuffer's (clamped) color range
    // --------------------------------------------------------------------------------------------------------------------------
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    shaderBloomFinal.use(gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, pingpongColorbuffers[horizontal ? 0 : 1]);
    shaderBloomFinal.setBoolean(gl, "bloom", bloom);
    shaderBloomFinal.setFloat(gl, "exposure", exposure);
    renderQuad();

}


// renderCube() renders a 1x1 3D cube in NDC.
// -------------------------------------------------
function renderCube() {
    if (!cubeVAO) {
        let vertices = new Float32Array([
            // back face
            - 1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
            1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0, 1.0, -1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
            // front face
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
            1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 0.0, // bottom-right
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
            1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0, // top-right
            -1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, // top-left
            -1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 0.0, 0.0, // bottom-left
            // left face
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
            -1.0, 1.0, -1.0, -1.0, 0.0, 0.0, 1.0, 1.0, // top-left
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, -1.0, -1.0, 0.0, 0.0, 0.0, 1.0, // bottom-left
            -1.0, -1.0, 1.0, -1.0, 0.0, 0.0, 0.0, 0.0, // bottom-right
            -1.0, 1.0, 1.0, -1.0, 0.0, 0.0, 1.0, 0.0, // top-right
            // right face
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
            1.0, 1.0, -1.0, 1.0, 0.0, 0.0, 1.0, 1.0, // top-right         
            1.0, -1.0, -1.0, 1.0, 0.0, 0.0, 0.0, 1.0, // bottom-right
            1.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0, // top-left
            1.0, -1.0, 1.0, 1.0, 0.0, 0.0, 0.0, 0.0, // bottom-left     
            // bottom face
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
            1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 1.0, 1.0, // top-left
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
            1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 1.0, 0.0, // bottom-left
            -1.0, -1.0, 1.0, 0.0, -1.0, 0.0, 0.0, 0.0, // bottom-right
            -1.0, -1.0, -1.0, 0.0, -1.0, 0.0, 0.0, 1.0, // top-right
            // top face
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
            1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 1.0, 1.0, // top-right     
            1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 1.0, 0.0, // bottom-right
            -1.0, 1.0, -1.0, 0.0, 1.0, 0.0, 0.0, 1.0, // top-left
            -1.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0, 0.0  // bottom-left        
        ]);
        cubeVAO = gl.createVertexArray();
        let cubeVBO = gl.createBuffer();
        // fill buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, cubeVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // link vertex attributes
        gl.bindVertexArray(cubeVAO);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindVertexArray(null);
    }
    // render Cube
    gl.bindVertexArray(cubeVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 36);
    gl.bindVertexArray(null);
}


// renderQuad() renders a 1x1 XY quad in NDC
function renderQuad() {

    if (!quadVAO) {
        let quadVertices = new Float32Array([
            // positions + texture Coords
            - 1.0, 1.0, 0.0, 0.0, 1.0,
            -1.0, -1.0, 0.0, 0.0, 0.0,
            1.0, 1.0, 0.0, 1.0, 1.0,
            1.0, -1.0, 0.0, 1.0, 0.0,
        ]);
        // setup plane VAO
        quadVAO = gl.createVertexArray();
        let quadVBO = gl.createBuffer();
        gl.bindVertexArray(quadVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 5 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 5 * sizeFloat, (3 * sizeFloat));
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.bindVertexArray(null);
}



// process keyboard input
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

    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_PRESS && !bloomKeyPressed) {
        bloom = !bloom;
        bloomKeyPressed = true;
    }
    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_RELEASE) {
        bloomKeyPressed = false;
    }
    if (keyInput.isDown(GLFW_KEY_Q) == GLFW_PRESS) {
        if (exposure > 0.0)
            exposure -= 0.01;
        else
            exposure = 0.0;
    }
    if (keyInput.isDown(GLFW_KEY_E) == GLFW_PRESS) {
        exposure += 0.01;
    }
}

// D3Q: mouse-callback: whenever the mouse moves, this callback is called
function mouse_move_callback(xoffset: number, yoffset: number, buttonID: number) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}

// D3Q: mouse-callback: whenever the mouse scroll wheel scrolls, this callback is called
function mouse_scroll_callback(yoffset: number) {
    camera.ProcessMouseScroll(yoffset);
}

/**
 * D3Q: loadTexture
 * loads an imagae from url. The gammaCorrection tells how to store
 * the data internally: as RGB(A) or SRGB(A).
 * I could find no decent way to find the number of components in an HTMLImageElement,
 * it is not in the interface; The interface to use would be ImageData. So, I've put
 * nrComponents in the parameterlist.
 * The numebr of internal data formats in WebGL is limited for SRGB(A). Only 8-bits seems to be
 * supported. 
 */
function loadTexture(url, nrComponents, gammaCorrection: boolean) {
    const textureID = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureID);

    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const level = 0;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA,
        1, 1, 0, gl.RGBA, srcType,
        pixel);

    const image = new Image();
    image.onload = function () {

        let internalFormat;
        let dataFormat;
        if (nrComponents == 1) {
            internalFormat = dataFormat = gl.RED;
        }
        else if (nrComponents == 3) {
            internalFormat = gammaCorrection ? gl.SRGB : gl.RGB;
            dataFormat = gl.RGB;
        }
        else if (nrComponents == 4) {
            internalFormat = gammaCorrection ? gl.SRGB8_ALPHA8 : gl.RGBA;
            dataFormat = gl.RGBA;
        }

        gl.bindTexture(gl.TEXTURE_2D, textureID);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, image.naturalWidth, image.naturalHeight, 0,
            dataFormat, gl.UNSIGNED_BYTE, image);
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    image.src = url;
    return textureID;
}