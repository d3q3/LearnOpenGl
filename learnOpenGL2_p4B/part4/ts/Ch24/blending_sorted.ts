import { vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import { fs_blending, vs_blending } from '../../js/Ch24/shaders/index.js'

import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';

import { VertexObject, Cube, Quad } from '../../js/geometry/VertexObjects.js'


const sizeFloat = 4;

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';

//global variables
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let keyInput: KeyInput;
let camera: Camera;
let cube: Cube;
let cubeVao: WebGLVertexArrayObject;
let plane: Quad;
let planeVao: WebGLVertexArrayObject;
let transparent: Quad;
let transparentVao: WebGLVertexArrayObject;
let cubeTexture: WebGLTexture;
let floorTexture: WebGLTexture;
let transparentTexture: WebGLTexture;
let shader: Shader;
let windows: vec3[];



// timing
let deltaTime: number = 0.0;
let lastFrame: number = 0.0;

// D3Q: process all mouse input using callbacks
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;


let main = function () {
    // canvas creation and initializing OpenGL context
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed"); return;
    }
    window.onresize = () => { framebufferSizeCallback(window.innerWidth, window.innerHeight) }

    // camera
    camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0), vec3.fromValues(0.0, 1.0, 0.0));

    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });

    // configure global opengl state
    // -----------------------------
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // build and compile shaders
    // -------------------------
    shader = new Shader(gl, vs_blending, fs_blending);

    // load textures
    // -------------
    cubeTexture = loadTexture("../../textures/marble.jpg", 4, false);
    floorTexture = loadTexture("../../textures/metal.png", 4, false);
    transparentTexture = loadTexture("../../textures/window.png", 4, false);

    //D3Q: creating cube, plane and transparent replaced with element from VertexObjects...
    plane = new Quad();
    planeVao = CreateVAO(plane, { POSITION: 0, TEXCOORD_0: 1 });

    cube = new Cube();
    cubeVao = CreateVAO(cube, { POSITION: 0, TEXCOORD_0: 1 });

    transparent = new Quad();
    transparentVao = CreateVAO(transparent, { POSITION: 0, TEXCOORD_0: 1 });

    // transparent window locations
    // --------------------------------
    windows =
        [
            vec3.fromValues(-2.0, 0.0, -0.48),
            vec3.fromValues(3.0, 0.0, 0.51),
            vec3.fromValues(0.0, 0.0, 2.7),
            vec3.fromValues(-0.6, 0.0, -2.3),
            vec3.fromValues(1.0, 0.0, -0.6)
        ];

    // shader configuration
    // --------------------
    shader.use(gl);
    shader.setInt(gl, "texture1", 0);

    requestAnimationFrame(render);
}();



// render loop
// -----------
function render() {
    // per-frame time logic
    // --------------------
    let currentFrame = performance.now() / 1000;
    deltaTime = (currentFrame - lastFrame) * 1000;
    lastFrame = currentFrame;

    // input
    // -----
    processInput();

    // sort the transparent windows before rendering
    // ---------------------------------------------
    // D3Q: javascript has only extra libs with sorted maps, so use sort method of arrays
    let sortArray = [];
    let sub = vec3.create();
    for (let i = 0; i < windows.length; i++) {
        let distance = vec3.len(vec3.subtract(sub, camera.Position, windows[i]));
        sortArray.push([distance, windows[i]]);
    }
    // D3Q: sort the array from large distance to small distance
    sortArray.sort(function (a, b) {
        return b[0] - a[0]
    });

    // render
    // ------
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw objects
    shader.use(gl);

    let projection: mat4 = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projection"), false, projection)

    let view: mat4 = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "view"), false, view)

    let model = mat4.create();
    mat4.identity(model);

    // cubes
    gl.bindVertexArray(cubeVao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, cubeTexture);
    mat4.translate(model, model, vec3.fromValues(-2.0, 0.0, -1.0));
    //model = glm:: translate(model, glm:: vec3(-1.0f, 0.0f, -1.0f));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model)

    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.TRIANGLES, 0, 36);

    mat4.identity(model);
    mat4.translate(model, model, vec3.fromValues(3.0, 0.0, 0.0));
    //model = glm:: translate(model, glm:: vec3(2.0f, 0.0f, 0.0f));
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model)

    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.TRIANGLES, 0, 36);

    // floor
    gl.bindVertexArray(planeVao);
    gl.bindTexture(gl.TEXTURE_2D, floorTexture);
    // Original code uses 5x5 plane at height y=-0.5
    // My cube is at height -1.0 and my plane is at z=+1.0
    mat4.identity(model);
    // fist scale, then rotate around X on vertices
    mat4.fromXRotation(model, Math.PI / 2);
    mat4.scale(model, model, [5.0, 5.0, 1.0]);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model)

    gl.drawElements(gl.TRIANGLES, plane.indices.length, gl.UNSIGNED_SHORT, 0);
    //gl.drawArrays(gl.TRIANGLES, 0, 6);


    // windows (from furthest to nearest)
    gl.bindVertexArray(transparentVao);
    gl.bindTexture(gl.TEXTURE_2D, transparentTexture);
    for (let i = 0, iLen = sortArray.length; i < iLen; i++) {

        model = mat4.identity(model);
        mat4.translate(model, model, sortArray[i][1]);
        gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "model"), false, model)

        gl.drawElements(gl.TRIANGLES, transparent.indices.length, gl.UNSIGNED_SHORT, 0);
        //gl.drawArrays(gl.TRIANGLES, 0, 6);
    }


    requestAnimationFrame(render);
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

/**
 * D3Q: Creates a GL vertexarray object for a geometry.
 * @param geo a subclass of Geometry
 * @param layout an object with the layout of attributes in the shader
 */
function CreateVAO(geo: VertexObject, layout: any) {
    let VAO = gl.createVertexArray();
    gl.bindVertexArray(VAO);

    const vbo: WebGLBuffer = gl.createBuffer();
    const ebo: WebGLBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, geo.vertices, gl.STATIC_DRAW);

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geo.indices, gl.STATIC_DRAW);

    // POSITION
    let acc = geo.accessors[geo.attributes.POSITION];
    gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
    gl.enableVertexAttribArray(layout.POSITION);

    // TEXTURE
    if (layout.TEXCOORD_0) {
        acc = geo.accessors[geo.attributes.TEXCOORD_0];
        gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.TEXCOORD_0);
    }
    // NORMAL
    if (layout.NORMAL) {
        acc = geo.accessors[geo.attributes.NORMAL];
        gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT, false, acc.stride, acc.byteOffset);
        gl.enableVertexAttribArray(layout.NORMAL);
    }
    return VAO;
};



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
            dataFormat = gl.RED;
            internalFormat = gl.R8;
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
