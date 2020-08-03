import { vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import { fs_lighting, vs_lighting, vs_hdr, fs_hdr } from '../../js/Ch39/shaders/index.js'

import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';

/**
 * D3Q: javascript version of Ch39 program in LearnOpenGL
 * rewrite of hdr.cpp.
 *
 * D3Q: There is no support for rendering to RGB16F textures in WebGL. We will make
 * use of the extension EXT_color_buffer_float. The EXT_color_buffer_float extension 
 * is part of WebGL and adds the ability to render a variety of floating point formats.
 * 
 * D3Q: Apart from the keys for moving through the scen the following keys are used:
 * keyboard key 1, 2, q an e. Key 1: HDR on, Key 2: HDR off.
 * Keys q and e are used to decrease or increase the exposure parameter. To use
 * the reinhard "algorithm" for HDR:uncomment the lines in fs_hdr.js.
 * 
 * The scene consists of a tunnel at (0.0, 0.0, 25.0) that is a scaled cube (scale = 
 * (2.5, 2.5, 27.5)). There are three colored light of low intensity (red, green and blue)
 * and a very intense white light at 0.0, 0.0, 49.5, just at the other end of the cube.
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

let hdr: boolean = true;
let exposure: number = 1.0;

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_1 = '1', GLFW_KEY_2 = '2', GLFW_KEY_Q = 'q', GLFW_KEY_E = 'e';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_1, GLFW_KEY_2, GLFW_KEY_Q, GLFW_KEY_E
});

//D3Q: global variables used in both main() and render()
let shader: Shader = null;
let hdrShader: Shader = null;
let hdrFBO: WebGLFramebuffer;
let colorBuffer: WebGLTexture;

let woodTexture: WebGLTexture;
//let colorBufferXX: WebGLTexture = loadTexture("../../textures/awesomeface.png", 4, false);
let projection: mat4 = mat4.create(), view: mat4 = mat4.create();
let lightPositions: Float32Array = null;
let lightColors: Float32Array = null;
let quadVAO = null;


// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 15.0), vec3.fromValues(0.0, 1.0, 0.0));

// timing
let deltaTime: number = 0.0;
let lastFrame: number = 0.0;

// D3Q: process all mouse input using callbacks
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;


// renderCube() renders a 1x1 3D cube in NDC.
let cubeVAO = null;
function renderCube() {
    // initialize (if necessary)
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
let quadVBO = null;
function renderQuad() {
    let quadVBO = null;
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
        quadVBO = gl.createBuffer();
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

let main = function () {

    // configure global opengl state
    gl.enable(gl.DEPTH_TEST);

    // build and compile shaders
    shader = new Shader(gl, vs_lighting, fs_lighting);
    hdrShader = new Shader(gl, vs_hdr, fs_hdr);

    // load textures
    woodTexture = loadTexture("../../textures/wood.png", 4, false);

    // configure floating point framebuffer
    hdrFBO = gl.createFramebuffer();
    // create floating point color buffer
    colorBuffer = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, canvas.width, canvas.height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // create depth buffer (a renderbuffer)
    let rboDepth;
    rboDepth = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, rboDepth);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, canvas.width, canvas.height);
    // attach buffers
    gl.bindFramebuffer(gl.FRAMEBUFFER, hdrFBO);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, colorBuffer, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rboDepth);
    let check = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (check != gl.FRAMEBUFFER_COMPLETE)
        console.log("Framebuffer not complete");
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // lighting info
    lightPositions = new Float32Array([
        0.0, 0.0, 49.5,
        -1.4, -1.9, 9.0,
        0.0, -1.8, 4.0,
        0.8, -1.7, 6.0
    ]);
    lightColors = new Float32Array([
        200.0, 200.0, 200.0,
        0.1, 0.0, 0.0,
        0.0, 0.0, 0.2,
        0.0, 0.1, 0.0
    ]);

    // shader configuration
    shader.use(gl);
    shader.setInt(gl, "diffuseTexture", 0);
    hdrShader.use(gl);
    hdrShader.setInt(gl, "hdrBuffer", 0);

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

    processInput();

    gl.clearColor(0.4, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // 1. render scene into floating point framebuffer
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

    // render tunnel
    let model: mat4 = mat4.create();
    mat4.translate(model, model, vec3.fromValues(0.0, 0.0, 25.0));
    mat4.scale(model, model, vec3.fromValues(2.5, 2.5, 27.5));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);

    shader.setBoolean(gl, "inverse_normals", true);
    renderCube();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // 2. now render floating point color buffer to 2D quad and tonemap HDR colors to default framebuffer's (clamped) color range
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    hdrShader.use(gl);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, colorBuffer);
    hdrShader.setBoolean(gl, "hdr", hdr);
    hdrShader.setFloat(gl, "exposure", exposure);
    renderQuad();
}


// process keyboard input
function processInput() {
    const GLFW_PRESS = true;
    if (keyInput.isDown(GLFW_KEY_W) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.FORWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_S) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.BACKWARD, deltaTime);
    if (keyInput.isDown(GLFW_KEY_A) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.LEFT, deltaTime);
    if (keyInput.isDown(GLFW_KEY_D) == GLFW_PRESS)
        camera.ProcessKeyboard(CameraMovement.RIGHT, deltaTime);

    if (keyInput.isDown(GLFW_KEY_1) == GLFW_PRESS) {
        hdr = true;
    }
    if (keyInput.isDown(GLFW_KEY_2) == GLFW_PRESS) {
        hdr = false;
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