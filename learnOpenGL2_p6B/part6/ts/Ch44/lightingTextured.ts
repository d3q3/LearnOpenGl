import { vec2, vec3, mat4 } from '../../../math/glmatrix/index.js';
import { vs_pbr, fs_pbr } from '../../js/Ch44/shaders/2/index.js';
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
//import { Sphere } from '../../js/geometry/sphere.js';
import { Sphere } from '../../js/geometry/VertexObjects.js'

// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

/**
 * D3Q: javascript version of Ch44 program in LearnOpenGL
 * rewrite of lighting_textured.cpp.
 * 
 * D3Q: Gebruik gemaakt van de meegeleverde textures. Meer textures zijn te vinden op
 * Freepbr.com. In de loadTexture gebruik gemaakt van dataFormat = gl.RED; en 
 * internalFormat = gl.R8; InternalFormat = gl.RED geeft een foutmelding.
 * De metalic en roughness files hebben een 1 component inhoud (1 kleur).
 * Voor het bekijken van de inhoud van png-files gebruik gemaakt van magick als console-
 * programma (zie inhoud magick.bat in de textures file).
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
let projection: mat4 = mat4.create(), view: mat4 = mat4.create(); let model = mat4.create();
let lightPositions: Float32Array = null;
let lightColors: Float32Array = null;
const nrRows = 7;
const nrColumns = 7;
const spacing = 2.5;
let sphereVAO: WebGLVertexArrayObject = null;
let sphere: Sphere;
let albedo = null; let normal = null; let metallic = null; let roughness = null; let ao = null;


// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 5.0), vec3.fromValues(0.0, 1.0, 0.0));

// window sizing
mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, window.innerWidth / window.innerHeight, 0.1, 100.0);
});

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

    // build and compile shaders
    shader = new Shader(gl, vs_pbr, fs_pbr);

    shader.use(gl);
    shader.setInt(gl, "albedoMap", 0);
    shader.setInt(gl, "normalMap", 1);
    shader.setInt(gl, "metallicMap", 2);
    shader.setInt(gl, "roughnessMap", 3);
    shader.setInt(gl, "aoMap", 4);

    // load PBR material textures
    // --------------------------
    albedo = loadTexture("../../textures/rustedIron/albedo.png", 4, false);
    normal = loadTexture("../../textures/rustedIron/normal.png", 3, false);
    metallic = loadTexture("../../textures/rustedIron/metallic.png", 1, false);
    roughness = loadTexture("../../textures/rustedIron/roughness.png", 1, false);
    ao = loadTexture("../../textures/rustedIron/ao.png", 3, false);

    // // initialize static shader uniforms before rendering
    // // --------------------------------------------------
    // gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);

    // render loop
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


    // render
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    shader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection);
    view = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view);
    gl.uniform3f(gl.getUniformLocation(shader.programId, "camPos"),
        camera.Position[0], camera.Position[1], camera.Position[2]);


    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, albedo);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, normal);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, metallic);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, roughness);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, ao);

    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(shader.programId, "lightColors"), lightColors);

    mat4.identity(model);
    for (let row = 0; row < nrRows; ++row) {
        for (let col = 0; col < nrColumns; ++col) {

            mat4.identity(model);
            mat4.translate(model, model, vec3.fromValues(
                (col - (nrColumns / 2)) * spacing,
                (row - (nrRows / 2)) * spacing,
                0.0
            ));
            gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
            renderSphere();
        }
    }

    // render light source (simply re-render sphere at light positions)
    // this looks a bit off as we use the same shader, but it'll make their positions obvious and 
    // keeps the codeprint small.
    for (let i = 0; i < 4; ++i) {
        //let newPos: vec3 = lightPositions[i] + glm:: vec3(sin(glfwGetTime() * 5.0) * 5.0, 0.0, 0.0);
        let newPos: vec3 = vec3.fromValues(lightPositions[3 * i], lightPositions[3 * i + 1], lightPositions[3 * i + 2]);

        //D3Q: pass only model to shader
        // shader.setVec3("lightPositions[" + i + "]", newPos);
        // shader.setVec3("lightColors[" + i + "]", lightColors[i]);
        // but maybe we should use metallic and roughness

        mat4.identity(model);
        mat4.translate(model, model, newPos);
        mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
        gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model);
        renderSphere();
    }

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

function renderSphere() {
    if (sphereVAO == null) {
        sphere = new Sphere(64, 64);
        sphereVAO = gl.createVertexArray();

        let vbo = gl.createBuffer();
        let ebo = gl.createBuffer();

        gl.bindVertexArray(sphereVAO);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, sphere.vertices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, sphere.indices, gl.STATIC_DRAW);

        //D3Q: position+uv+normal
        let stride = (3 + 2 + 3) * sizeFloat;
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, (6 * sizeFloat));
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, (3 * sizeFloat));

    }
    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

}


// function renderSphere() {
//     if (sphereVAO == null) {
//         sphereVAO = gl.createVertexArray(); //GenVertexArrays(1, & sphereVAO);

//         let vbo, ebo;
//         vbo = gl.createBuffer(); //GenBuffers(1, & vbo);
//         ebo = gl.createBuffer();//GenBuffers(1, & ebo);

//         let positions: vec3[] = [];
//         let uv: vec2[] = [];
//         let normals: vec3[] = [];
//         let indices: number[] = [];;

//         const X_SEGMENTS = 64;
//         const Y_SEGMENTS = 64;
//         const PI = 3.14159265359;
//         for (let y = 0; y <= Y_SEGMENTS; ++y) {
//             for (let x = 0; x <= X_SEGMENTS; ++x) {
//                 let xSegment = x / X_SEGMENTS;
//                 let ySegment = y / Y_SEGMENTS;
//                 let xPos = Math.cos(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);
//                 let yPos = Math.cos(ySegment * PI);
//                 let zPos = Math.sin(xSegment * 2.0 * PI) * Math.sin(ySegment * PI);

//                 positions.push(vec3.fromValues(xPos, yPos, zPos));
//                 uv.push(vec2.fromValues(xSegment, ySegment));
//                 normals.push(vec3.fromValues(xPos, yPos, zPos));
//             }
//         }

//         let oddRow = false;
//         for (let y = 0; y < Y_SEGMENTS; ++y) {
//             if (!oddRow) // even rows: y == 0, y == 2; and so on
//             {
//                 for (let x = 0; x <= X_SEGMENTS; ++x) {
//                     indices.push(y * (X_SEGMENTS + 1) + x);
//                     indices.push((y + 1) * (X_SEGMENTS + 1) + x);
//                 }
//             }
//             else {
//                 for (let x = X_SEGMENTS; x >= 0; --x) {
//                     indices.push((y + 1) * (X_SEGMENTS + 1) + x);
//                     indices.push(y * (X_SEGMENTS + 1) + x);
//                 }
//             }
//             oddRow = !oddRow;
//         }
//         indexCount = indices.length;

//         let data: number[] = [];
//         for (let i = 0; i < positions.length; ++i) {
//             data.push(positions[i][0]);
//             data.push(positions[i][1]);
//             data.push(positions[i][2]);
//             if (uv.length > 0) {
//                 data.push(uv[i][0]);
//                 data.push(uv[i][1]);
//             }
//             if (normals.length > 0) {
//                 data.push(normals[i][0]);
//                 data.push(normals[i][1]);
//                 data.push(normals[i][2]);
//             }
//         }
//         gl.bindVertexArray(sphereVAO);
//         gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
//         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
//         gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
//         gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
//         let stride = (3 + 2 + 3) * 4;
//         gl.enableVertexAttribArray(0);
//         gl.vertexAttribPointer(0, 3, gl.FLOAT, false, stride, 0);
//         gl.enableVertexAttribArray(1);
//         gl.vertexAttribPointer(1, 2, gl.FLOAT, false, stride, (3 * 4));
//         gl.enableVertexAttribArray(2);
//         gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, (5 * 4));
//     }

//     gl.bindVertexArray(sphereVAO);
//     gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_SHORT, 0);
// }

/**
 * D3Q: loadTexture
 * loads an imagae from url. The gammaCorrection parameter tells how to store
 * the data internally: as RGB(A) or SRGB(A).
 * I could find no decent way to find the number of components in an HTMLImageElement,
 * it is not in the interface;  So, I've put nrComponents in the parameterlist.
 * The numebr of internal data formats in WebGL is limited for SRGB(A). Only 8-bits seems 
 * to be supported and only for 3 or 4 components. 
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
            dataFormat = gl.RED;
            internalFormat = gl.R8;
        }
        else if (nrComponents == 3) {
            internalFormat = gammaCorrection ? gl.SRGB8 : gl.RGB;
            dataFormat = gl.RGB;
        }
        else if (nrComponents == 4) {
            internalFormat = gammaCorrection ? gl.SRGB8_ALPHA8 : gl.RGBA;
            dataFormat = gl.RGBA;
        }

        gl.bindTexture(gl.TEXTURE_2D, textureID);
        gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, image.naturalWidth, image.naturalHeight, 0,
            dataFormat, gl.UNSIGNED_BYTE, image);

        //if (nrComponents == 4)
        gl.generateMipmap(gl.TEXTURE_2D);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    image.src = url;
    return textureID;
}

