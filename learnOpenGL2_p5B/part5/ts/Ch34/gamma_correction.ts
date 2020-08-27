import { vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import { fs_gamma_correction, vs_gamma_correction } from '../../js/Ch34/shaders/index.js'
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';


// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

/**
 * D3Q: javascript version of Ch34 program in LearnOpenGL
 * rewrite of gamma_correction.cpp.
 * 
 * D3Q: In the textbook Ch34 glEnable(GL_FRAMEBUFFER_SRGB) is mentioned. However,
 * support of SRGB in WebGL is done using an extentension in WebGL1, see
 * https://developer.mozilla.org/en-US/docs/Web/API/EXT_sRGB and using
 * gl.FRAMEBUFFER_ATTACHMENT_COLOR_ENCODING and the internal color formats
 * in webGL2.
 * 
 * D3Q: In this program the second option of the textbook is illustrated. The variable
 * gammaEnabled is used in the internal representation of textures (RGBA vs SRGBA)
 * and in the shader uniform "gamma". In de shader "gamma" is used for the exponential
 * repair (color = pow(abs(color), vec3(1.0/2.2));) as well as for the attenuation of the
 * light sources.
 * Press the spacebar to change between gamma corrected and not corrected.  
 */

// creating window (canvas) and rendering context (gl)
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

var gl: WebGL2RenderingContext = canvas.getContext('webgl2', { antialias: true });

let gammaEnabled: boolean = false;
let gammaKeyPressed: boolean = false;

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd', GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({ GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D, GLFW_KEY_SPACE });

//D3Q: global variables used in both main() and render()
let shader: Shader = null;
let glPlaneVAO: WebGLVertexArrayObject = 0;
let floorTexture: WebGLTexture = loadTexture("../../textures/wood.png", 4, false);
let floorTextureGammaCorrected = loadTexture("../../textures/wood.png", 4, true);
let lightPositions: Float32Array = null;
let lightColors: Float32Array = null;
let projection: mat4 = mat4.create(), view: mat4 = mat4.create();

// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));

// timing
let deltaTime: number = 0.0;
let lastFrame: number = 0.0;

// D3Q: process all mouse input using callbacks
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;


let main = function () {
    // configure global opengl state
    // -----------------------------
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // build and compile shaders
    // D3Q: 
    // .vs has following uniforms: projection and view
    // .fs has following uniforms: lightPositions[4], lightColors[4], viewPos and gamma
    shader = new Shader(gl, vs_gamma_correction, fs_gamma_correction);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    let planeVertices = [
        // positions  + normals + texcoords
        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 0.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,

        10.0, -0.5, 10.0, 0.0, 1.0, 0.0, 10.0, 0.0,
        -10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 0.0, 10.0,
        10.0, -0.5, -10.0, 0.0, 1.0, 0.0, 10.0, 10.0
    ];
    // plane VAO
    const POSITION_LOCATION = 0;
    const NORMAL_LOCATION = 1;
    const TEXCOORD_0_LOCATION = 2;
    const sizeFloat = 4;

    glPlaneVAO = gl.createVertexArray();
    let planeVBO = gl.createBuffer();
    gl.bindVertexArray(glPlaneVAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, planeVBO);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(planeVertices), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(POSITION_LOCATION);
    gl.vertexAttribPointer(POSITION_LOCATION, 3, gl.FLOAT, false, 8 * sizeFloat, 0);
    gl.enableVertexAttribArray(NORMAL_LOCATION);
    gl.vertexAttribPointer(NORMAL_LOCATION, 3, gl.FLOAT, false, 8 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(TEXCOORD_0_LOCATION);
    gl.vertexAttribPointer(TEXCOORD_0_LOCATION, 2, gl.FLOAT, false, 8 * sizeFloat, (6 * sizeFloat));
    gl.bindVertexArray(null);

    // D3Q: load textures using utility function below
    floorTexture = loadTexture("../../textures/wood.png", 4, false);
    floorTextureGammaCorrected = loadTexture("../../textures/wood.png", 4, true);

    shader.use(gl);
    let floorTextureLocation = gl.getUniformLocation(shader.programId, "floorTexture");
    gl.uniform1i(floorTextureLocation, 0);
    //shader.setInt("floorTexture", 0);

    // lighting info
    // -------------
    lightPositions = new Float32Array([
        -3.0, 0.0, 0.0,
        -1.0, 0.0, 0.0,
        1.0, 0.0, 0.0,
        3.0, 0.0, 0.0
    ]);
    lightColors = new Float32Array([
        0.25, 0.25, 0.25,
        0.50, 0.50, 0.50,
        0.75, 0.75, 0.75,
        1.00, 1.00, 1.00
    ]);

    animate();
}()

function animate() {
    //updateScene();
    render(glPlaneVAO, shader);
    requestAnimationFrame(animate);
}

//render scene
function render(vao: WebGLVertexArrayObject, shader: Shader) {
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    processInput();

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shader.use(gl);

    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    view = camera.GetViewMatrix();

    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    // set light uniforms
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);

    gl.uniform3fv(gl.getUniformLocation(shader.programId, "viewPos"), camera.Position);
    gl.uniform1i(gl.getUniformLocation(shader.programId, "gamma"), gammaEnabled ? 1 : 0);

    // floor
    gl.bindVertexArray(glPlaneVAO);
    gl.activeTexture(gl.TEXTURE0);
    let floorTex = gammaEnabled ? floorTextureGammaCorrected : floorTexture;
    gl.bindTexture(gl.TEXTURE_2D, floorTex);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
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

    //D3Q: press space bar to change gammaEnabled press a second time
    //to restore original value
    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_PRESS && !gammaKeyPressed) {
        gammaEnabled = !gammaEnabled;
        gammaKeyPressed = true;
    }
    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_RELEASE) {
        gammaKeyPressed = false;
    }
}


// D3Q: mouse-callback: whenever the mouse moves, this callback is called
// -------------------------------------------------------
function mouse_move_callback(xoffset: number, yoffset: number, buttonID: number) {
    if (buttonID == 1)
        camera.ProcessMouseMovement(xoffset, yoffset);
}

// D3Q: mouse-callback: whenever the mouse scroll wheel scrolls, this callback is called
// ----------------------------------------------------------------------
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
            internalFormat = gammaCorrection ? gl.SRGB8_ALPHA8 : gl.RGBA8;
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
