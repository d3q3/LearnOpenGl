import { vec2, vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import { fs_normalMapping, vs_normalMapping } from '../../js/Ch37/shaders/index.js'
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';

/**
 *  D3Q: javascript version of Ch39 program in LearnOpenGL
 * rewrite of normal_mapping.cpp.
 * 
 * Normal mapping & Tangent space: showing a rotating quad
 */

const sizeFloat = 4;

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
let diffuseMap: WebGLTexture, normalMap: WebGLTexture;
let projection: mat4 = mat4.create(), view: mat4 = mat4.create();
let lightPos: vec3;
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
    shader = new Shader(gl, vs_normalMapping, fs_normalMapping);

    // load textures
    diffuseMap = loadTexture("../../textures/brickwall.jpg", 4, false);
    normalMap = loadTexture("../../textures/brickwall_normal.jpg", 4, false);

    // shader configuration
    shader.use(gl);
    shader.setInt(gl, "diffuseMap", 0);
    shader.setInt(gl, "normalMap", 1);

    // lighting info
    lightPos = vec3.fromValues(0.5, 1.0, 0.3);

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

    // input
    processInput();

    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    view = camera.GetViewMatrix();

    shader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);

    // render normal-mapped quad
    let model = mat4.create();
    let axis = vec3.create();
    vec3.normalize(axis, vec3.fromValues(1.0, 0.0, 1.0));
    // rotate the quad to show normal mapping from multiple directions
    mat4.rotate(model, model, (currentFrame / 1000.0) * Math.PI / 180, axis);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "viewPos"), camera.Position);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPos"), lightPos);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normalMap);
    renderQuad();

    // render light source (simply re-renders a smaller plane at the 
    // light's position for debugging/visualization)
    mat4.identity(model);
    mat4.translate(model, model, lightPos);
    mat4.scale(model, model, vec3.fromValues(0.1, 0.1, 0.1));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
    renderQuad();
}

// renders a 1x1 quad in NDC with manually calculated tangent vectors
function renderQuad() {
    let quadVBO = null;

    if (!quadVAO) {
        // positions
        let pos1 = vec3.fromValues(-1.0, 1.0, 0.0);
        let pos2 = vec3.fromValues(-1.0, -1.0, 0.0);
        let pos3 = vec3.fromValues(1.0, -1.0, 0.0);
        let pos4 = vec3.fromValues(1.0, 1.0, 0.0);
        // texture coordinates
        let uv1 = vec2.fromValues(0.0, 1.0);
        let uv2 = vec2.fromValues(0.0, 0.0);
        let uv3 = vec2.fromValues(1.0, 0.0);
        let uv4 = vec2.fromValues(1.0, 1.0);
        // normal vector
        let nm = vec3.fromValues(0.0, 0.0, 1.0);

        // calculate tangent/bitangent vectors of both triangles
        let tangent1 = vec3.create(), bitangent1 = vec3.create();
        let tangent2 = vec3.create(), bitangent2 = vec3.create();

        // triangle 1
        let edge1 = vec3.create(); vec3.subtract(edge1, pos2, pos1);
        let edge2 = vec3.create(); vec3.subtract(edge2, pos3, pos1);
        let deltaUV1 = vec2.create(); vec2.subtract(deltaUV1, uv2, uv1);
        let deltaUV2 = vec2.create(); vec2.subtract(deltaUV2, uv3, uv1);

        let f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        tangent1[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
        tangent1[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
        tangent1[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
        vec3.normalize(tangent1, tangent1);

        bitangent1[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
        bitangent1[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
        bitangent1[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
        vec3.normalize(bitangent1, bitangent1);

        // triangle 2
        vec3.subtract(edge1, pos3, pos1);
        vec3.subtract(edge2, pos4, pos1);
        vec2.subtract(deltaUV1, uv3, uv1);
        vec2.subtract(deltaUV2, uv4, uv1);

        f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        tangent2[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
        tangent2[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
        tangent2[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);
        vec3.normalize(tangent2, tangent2);


        bitangent2[0] = f * (-deltaUV2[0] * edge1[0] + deltaUV1[0] * edge2[0]);
        bitangent2[1] = f * (-deltaUV2[0] * edge1[1] + deltaUV1[0] * edge2[1]);
        bitangent2[2] = f * (-deltaUV2[0] * edge1[2] + deltaUV1[0] * edge2[2]);
        vec3.normalize(bitangent2, bitangent2);


        let quadVertices = new Float32Array([
            // positions + normal + texcoords + tangent  + bitangent
            pos1[0], pos1[1], pos1[2], nm[0], nm[1], nm[2], uv1[0], uv1[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],
            pos2[0], pos2[1], pos2[2], nm[0], nm[1], nm[2], uv2[0], uv2[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],
            pos3[0], pos3[1], pos3[2], nm[0], nm[1], nm[2], uv3[0], uv3[1], tangent1[0], tangent1[1], tangent1[2], bitangent1[0], bitangent1[1], bitangent1[2],

            pos1[0], pos1[1], pos1[2], nm[0], nm[1], nm[2], uv1[0], uv1[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2],
            pos3[0], pos3[1], pos3[2], nm[0], nm[1], nm[2], uv3[0], uv3[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2],
            pos4[0], pos4[1], pos4[2], nm[0], nm[1], nm[2], uv4[0], uv4[1], tangent2[0], tangent2[1], tangent2[2], bitangent2[0], bitangent2[1], bitangent2[2]
        ]);
        // setup plane VAO
        quadVAO = gl.createVertexArray();
        quadVBO = gl.createBuffer();
        gl.bindVertexArray(quadVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 14 * sizeFloat, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 14 * sizeFloat, 3 * sizeFloat);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 14 * sizeFloat, 6 * sizeFloat);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 3, gl.FLOAT, false, 14 * sizeFloat, 8 * sizeFloat);
        gl.enableVertexAttribArray(4);
        gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 14 * sizeFloat, 11 * sizeFloat);
    }
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
}


// process the normal keys for moving through scene
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