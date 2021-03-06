import { vs_lighting_maps, fs_lighting_maps, vs_lamp, fs_lamp } from "../../js/Ch21/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { VertexObject, Accessor, Cube, Sphere2 } from "../../js/geometry/VertexObjects.js"


// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0. 
// For more information please visit https://learnopengl.com/About

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
let sphereVAO: WebGLVertexArrayObject;
let lightingShader: Shader;
let lampShader: Shader;
let keyInput: KeyInput;
let mouse: Mouse;
let diffuseMap: WebGLTexture;
let specularMap: WebGLTexture;
let cube: Cube;
let sphere: Sphere2;

// lighting
let lightPos = vec3.fromValues(0.0, 0.5, 2.0);

let main = function () {
    // canvas creation and initializing OpenGL context 
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed"); return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight) }

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
    lightingShader = new Shader(gl, vs_lighting_maps, fs_lighting_maps);
    lampShader = new Shader(gl, vs_lamp, fs_lamp);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    sphere = new Sphere2(12, 12);
    sphereVAO = createVAO(sphere, { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 });
    cube = new Cube();
    cubeVAO = createVAO(cube, { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 })
    // load textures (we now use a utility function to keep the code more organized)
    // -----------------------------------------------------------------------------
    diffuseMap = gl.createTexture();
    loadTexture("../../textures/container2.png", diffuseMap);
    specularMap = gl.createTexture();
    loadTexture("../../textures/container2_specular.png", specularMap);

    // shader configuration
    // --------------------
    lightingShader.use(gl);
    lightingShader.setInt(gl, "material.diffuse", 0);
    lightingShader.setInt(gl, "material.specular", 1);

    requestAnimationFrame(render);
}();

// render loop
function render() {
    // per-frame time logic
    // --------------------
    let currentFrame = performance.now() / 1000;

    deltaTime = (currentFrame - lastFrame) * 1000;
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
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);

    // light properties
    lightingShader.setFloat3(gl, "light.ambient", 0.2, 0.2, 0.2);
    lightingShader.setFloat3(gl, "light.diffuse", 0.5, 0.5, 0.5);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);

    // material properties
    lightingShader.setFloat(gl, "material.shininess", 64.0);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);


    // bind diffuse map
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, diffuseMap);
    // bind specular map
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, specularMap);

    // render the cube
    let modelCube = mat4.create();
    mat4.translate(modelCube, modelCube, vec3.fromValues(0.5, 0.0, 0.0));
    setMat4vShader(lightingShader, "model", modelCube);
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);

    //render the sphere
    let modelSphere = mat4.create();
    mat4.translate(modelSphere, modelSphere, vec3.fromValues(-0.5, 0.0, 0.0));
    setMat4vShader(lightingShader, "model", modelSphere);
    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLE_STRIP, sphere.indices.length, gl.UNSIGNED_SHORT, 0);

    // also draw the lamp object
    lampShader.use(gl);
    setMat4vShader(lampShader, "projection", projection);
    setMat4vShader(lampShader, "view", view);
    let modelLamp = mat4.create();
    mat4.translate(modelLamp, modelLamp, lightPos);
    mat4.scale(modelLamp, modelLamp, vec3.fromValues(0.2, 0.2, 0.2)); // a smaller cube
    setMat4vShader(lampShader, "model", modelLamp);

    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);

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

function loadTexture(url: string, texture: WebGLTexture) {
    initTexture(gl, texture);

    const image1 = new Image();
    image1.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image1);

        // set the texture wrapping parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
        // set texture filtering parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);

    }
    image1.src = url;
}

//
// Initialize a texture and load an image.
// When the image finished loading copy it into the texture.
//
function initTexture(gl: WebGL2RenderingContext, texture: WebGLTexture) {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Because images have to be download over the internet
    // they might take a moment until they are ready.
    // Until then put a single pixel in the texture so we can
    // use it immediately. When the image has finished downloading
    // we'll update the texture with the contents of the image.
    const width = 1;
    const height = 1;
    const pixel = new Uint8Array([0, 0, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB,
        width, height, 0, gl.RGB, gl.UNSIGNED_BYTE,
        pixel);
}

function createVAO(vo: VertexObject, layout: any) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    const ebo: WebGLBuffer = gl.createBuffer();

    // const vbo: WebGLBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

    let vbos: WebGLBuffer[] = [];
    vo.getBuffers().forEach(buf => {
        const vbo: WebGLBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW);
        vbos.push(vbo);
    })

    //gl.bufferData(gl.ARRAY_BUFFER, vo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, vo.indices, gl.STATIC_DRAW);

    let acc: Accessor;
    // POSITION
    acc = vo.accessors[vo.attributes.POSITION];
    gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
    gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
    gl.enableVertexAttribArray(layout.POSITION);

    // TEXTURE
    if (layout.TEXCOORD_0) {
        acc = vo.accessors[vo.attributes.TEXCOORD_0];
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.TEXCOORD_0);
    }
    // NORMAL
    if (layout.NORMAL) {
        acc = vo.accessors[vo.attributes.TEXCOORD_0];
        gl.bindBuffer(gl.ARRAY_BUFFER, vbos[acc.bufferId]);
        acc = vo.accessors[vo.attributes.NORMAL];
        gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.NORMAL);
    }
    return VAO;
};

