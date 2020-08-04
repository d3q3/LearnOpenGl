import { vec3, vec4, mat4 } from '../../../math/glmatrix/index.js';
import {
    vs_cubemap, fs_equirectangularToCubemap,
    vs_cubeface, fs_cubeface
} from '../../js/Ch45/shaders/1/index.js';
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
//import { Sphere, Sphere2 } from '../../js/geometry/sphere.js';

/**
 * D3Q: javascript version of part of Ch45 program in LearnOpenGL
 * rewrite of part of ibl_irradiance.cpp.
 * 
 * D3Q: The first part of the ibl_irradiance.cpp program is used to look at the six
 * faces of the cubic environment map.
 * 
 * Use the spacebar to change the coloring. One option shows the Horizontal section of the
 * cross-representation of the cubemap. The other shows where one of the components of
 * the image becomes more than 1.0.
 * 
 * A technical problem is to find the right combination of internalFarmat, type and format
 * for the cubemap texture. 
 * I have put two times the checkFramebufferStatus() in the code to find the reason if there
 * is not a good result on screen.
 * Also have a look at https://github.com/matheowis/HDRI-to-CubeMap
 * 
 * Another technical problem is the orientation of the different faces of the cubemap.
 * look at:https://www.khronos.org/opengl/wiki/Cubemap_Texture
 */

const sizeFloat = 4;

const whCube = 512;

// creating window (canvas) and rendering context (gl)
let canvas = document.createElement('canvas');
canvas.width = 4 * whCube; //window.innerWidth;
canvas.height = 1.2 * whCube;// window.innerHeight;
document.body.appendChild(canvas);

var gl: WebGL2RenderingContext = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}

const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}

let showIntensity: boolean = true;
let showLeftRight: boolean = true;
let spacePressed: boolean = false;
//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_1 = '1', GLFW_KEY_2 = '2',
    GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_1, GLFW_KEY_2,
    GLFW_KEY_SPACE
});

//D3Q: global variables used in both main() and render()
let equirectangularToCubemapShader: Shader = null;
let cubefaceShader: Shader = null;

let cubeVAO = null;
let quadVAO = null;
let envCubemap = null;

// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));

// timing
let deltaTime: number = 0.0;

// D3Q: process all mouse input using callbacks
let mouse = new Mouse();
mouse.moveCallback = mouse_move_callback;
mouse.scrollCallback = mouse_scroll_callback;

// D3Q: the views for the faces of a cube, all views have (0,0,0) as origin. Layout:
//       Top    
// Left  Front  Right Back
//       Bottom
// For the orientation of the up-axis, see: https://www.khronos.org/opengl/wiki/Cubemap_Texture
let captureViews = [
    //Right
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(1.0, 0.0, 0.0), vec3.fromValues(0.0, -1.0, 0.0)),
    //Left
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(-1.0, 0.0, 0.0), vec3.fromValues(0.0, -1.0, 0.0)),
    //Top
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 1.0, 0.0), vec3.fromValues(0.0, 0.0, 1.0)),
    //Bottom
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, -1.0, 0.0), vec3.fromValues(0.0, 0.0, -1.0)),
    //Front
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, 1.0), vec3.fromValues(0.0, -1.0, 0.0)),
    //Back
    mat4.lookAt(mat4.create(), vec3.fromValues(0.0, 0.0, 0.0), vec3.fromValues(0.0, 0.0, -1.0), vec3.fromValues(0.0, -1.0, 0.0))
];


let main = function () {
    // configure global opengl state
    gl.enable(gl.DEPTH_TEST);
    // set depth function to less than AND equal for skybox depth trick.
    gl.depthFunc(gl.LEQUAL);

    // build and compile shaders
    // -------------------------
    equirectangularToCubemapShader = new Shader(gl, vs_cubemap, fs_equirectangularToCubemap);
    cubefaceShader = new Shader(gl, vs_cubeface, fs_cubeface);

    cubefaceShader.use(gl);
    cubefaceShader.setInt(gl, "environmentMap", 0);

    // load the HDR environment map
    loadHDR("../../textures/hdr/newport_loft.hdr", toCubemap);
}();

function toCubemap(data, width, height) {
    // pbr: setup framebuffer
    let captureFBO = gl.createFramebuffer();
    let captureRBO = gl.createRenderbuffer();

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, whCube, whCube);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, captureRBO);

    let hdrTexture;
    if (data) {
        let floats = rgbeToFloat(data);
        hdrTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        // note how we specify the texture's data value to be float
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB16F, width, height, 0, gl.RGB, gl.FLOAT, floats);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    }
    else {
        console.log("Failed to load HDR image.");
    }

    // pbr: setup cubemap to render to and attach to framebuffer
    envCubemap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    // reserve the six buffers for a cube, also in hdr format (use of RGB16F)
    // 0	GL_TEXTURE_CUBE_MAP_POSITIVE_X
    // 1	GL_TEXTURE_CUBE_MAP_NEGATIVE_X
    // 2	GL_TEXTURE_CUBE_MAP_POSITIVE_Y
    // 3	GL_TEXTURE_CUBE_MAP_NEGATIVE_Y
    // 4	GL_TEXTURE_CUBE_MAP_POSITIVE_Z
    // 5	GL_TEXTURE_CUBE_MAP_NEGATIVE_Z
    for (let i = 0; i < 6; ++i) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F,
            whCube, whCube, 0, gl.RGBA, gl.FLOAT, new Float32Array(whCube * whCube * 4));
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // pbr: set up projection and view matrices for capturing data onto the 6 cubemap face directions
    // ----------------------------------------------------------------------------------------------
    let captureProjection: mat4 = mat4.create();
    mat4.perspective(captureProjection, (90.0) * Math.PI / 180, 1.0, 0.1, 10.0);

    // pbr: convert HDR equirectangular environment map to cubemap equivalent
    // ----------------------------------------------------------------------
    equirectangularToCubemapShader.use(gl);
    equirectangularToCubemapShader.setInt(gl, "equirectangularMap", 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(equirectangularToCubemapShader.programId, "projection"), false, captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
    // don't forget to configure the viewport to the capture dimensions.
    gl.viewport(0, 0, whCube, whCube);
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    let error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(1) status error= " + error);
    for (let i = 0; i < 6; ++i) {
        gl.uniformMatrix4fv(gl.getUniformLocation(equirectangularToCubemapShader.programId, "view"), false, captureViews[i]);
        // D3Q: use one of the six buffers of envCubeMap as colorbuffer of captureFBO
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
        let error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(2) status error= " + error);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //gl.clear(gl.DEPTH_BUFFER_BIT);
        renderCube();
    }
    // D3Q: now all faces in envCubemap are written to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    //D3Q: show the first of the six buffers of envCubeMap
    cubefaceShader.use(gl);
    let projection: mat4 = mat4.create();
    mat4.perspective(projection, 0.5 * Math.PI, canvas.width / canvas.height, 0.1, 10.0);
    gl.uniformMatrix4fv(gl.getUniformLocation(cubefaceShader.programId, "projection"), false, projection);

    animate();
}

function animate() {
    //updateScene
    gl.clearColor(0.1, 0.1, 0.1, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    showCubefaces();
    processInput();
    requestAnimationFrame(animate);
}

function showCubefaces() {
    cubefaceShader.setBoolean(gl, "showIntensity", showIntensity);
    // I will use the openGL id's for the different sides of the cube
    // Lefthanded, positive Z is backside cube!
    // 0	GL_TEXTURE_CUBE_MAP_POSITIVE_X =right
    // 1	GL_TEXTURE_CUBE_MAP_NEGATIVE_X =left
    // 2	GL_TEXTURE_CUBE_MAP_POSITIVE_Y =top
    // 3	GL_TEXTURE_CUBE_MAP_NEGATIVE_Y =bottom
    // 4	GL_TEXTURE_CUBE_MAP_POSITIVE_Z =back!
    // 5	GL_TEXTURE_CUBE_MAP_NEGATIVE_Z =front!
    if (showLeftRight) {
        [1, 5, 0, 4].forEach((id, index) => showCubeface(id, index));
    }
    else
        [2, 5, 3].forEach((id, index) => showCubeface(id, index));
}

function showCubeface(id: number, index) {
    cubefaceShader.setFloat(gl, "index", index);
    cubefaceShader.setInt(gl, "id", id);
    cubefaceShader.setFloat(gl, "aspectRatio", canvas.width / canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    renderQuad();
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

    if (keyInput.isDown(GLFW_KEY_1) == GLFW_PRESS) {
        showLeftRight = true;
        showCubefaces();
    }

    if (keyInput.isDown(GLFW_KEY_2) == GLFW_PRESS) {
        showLeftRight = false;
        showCubefaces();
    }

    if ((keyInput.isDown(GLFW_KEY_SPACE) == GLFW_PRESS) && !spacePressed) {
        spacePressed = true;
        showIntensity = !showIntensity;
        showCubefaces();
    }

    if (keyInput.isDown(GLFW_KEY_SPACE) == GLFW_RELEASE) {
        spacePressed = false;
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

function renderQuad() {
    if (!quadVAO) {
        let vertices = new Float32Array([
            // front face
            - 1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 0.0, // bottom-right         
            1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 1.0, 1.0, // top-right
            -1.0, -1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 0.0, // bottom-left
            -1.0, 1.0, 1.0, 0.0, 0.0, -1.0, 0.0, 1.0, // top-left
        ]);

        quadVAO = gl.createVertexArray();
        let quadVBO = gl.createBuffer();
        // fill buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
        // link vertex attributes
        gl.bindVertexArray(quadVAO);
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
    gl.bindVertexArray(quadVAO);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.bindVertexArray(null);
}


// renderCube() renders a 1x1 3D cube in NDC.
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

/*************************
 * The following functions, rgbeToFloat(buffer) and loadHDR(url, completion)
 * are from https://github.com/enkimute/hdrpng.js. The code is released
 * on that site with a MIT license.
 */

/** Convert an RGBE buffer to a Float buffer.
  * @param {Uint8Array} buffer The input buffer in RGBE format. (as returned from loadHDR)
  * @param {Float32Array} [res] Optional result buffer containing 3 floats per pixel.
  * @returns {Float32Array} A floating point buffer with 96 bits per pixel (32 per channel, 3 channels).
  */
function rgbeToFloat(buffer) { //}, res) {
    var s, l = buffer.byteLength >> 2, res = res || new Float32Array(l * 3);
    for (var i = 0; i < l; i++) {
        s = Math.pow(2, buffer[i * 4 + 3] - (128 + 8));
        res[i * 3] = buffer[i * 4] * s;
        res[i * 3 + 1] = buffer[i * 4 + 1] * s;
        res[i * 3 + 2] = buffer[i * 4 + 2] * s;
    }
    return res;
}

function m(a, b) { for (var i in b) a[i] = b[i]; return a; };

/** Load and parse a Radiance .HDR file. It completes with a 32bit RGBE buffer.
  * @param {URL} url location of .HDR file to load.
  * @param {function} completion completion callback (img, width, height).
  * @returns {XMLHttpRequest} the XMLHttpRequest used to download the file.
  */
function loadHDR(url, completion) {
    var req = m(new XMLHttpRequest(), { responseType: "arraybuffer" });
    req.onerror = completion.bind(req, false);
    req.onload = function () {
        if (this.status >= 400) return this.onerror();
        var header = '', pos = 0, d8 = new Uint8Array(this.response), format;
        // read header.  
        while (!header.match(/\n\n[^\n]+\n/g)) header += String.fromCharCode(d8[pos++]);
        // check format. 
        format = header.match(/FORMAT=(.*)$/m)[1];
        if (format != '32-bit_rle_rgbe') return console.warn('unknown format : ' + format), this.onerror();
        // parse resolution
        var rez = header.split(/\n/).reverse()[1].split(' '), width = +rez[3] * 1, height = +rez[1] * 1;
        // Create image.
        var img = new Uint8Array(width * height * 4), ipos = 0;
        // Read all scanlines
        for (var j = 0; j < height; j++) {
            var rgbe = d8.slice(pos, pos += 4), scanline = [];
            if (rgbe[0] != 2 || (rgbe[1] != 2) || (rgbe[2] & 0x80)) {
                var len = width, rs = 0; pos -= 4; while (len > 0) {
                    img.set(d8.slice(pos, pos += 4), ipos);
                    if (img[ipos] == 1 && img[ipos + 1] == 1 && img[ipos + 2] == 1) {
                        for (img[ipos + 3] << rs; i > 0; i--) {
                            img.set(img.slice(ipos - 4, ipos), ipos);
                            ipos += 4;
                            len--
                        }
                        rs += 8;
                    } else { len--; ipos += 4; rs = 0; }
                }
            } else {
                if ((rgbe[2] << 8) + rgbe[3] != width) return console.warn('HDR line mismatch ..'), this.onerror();
                for (var i = 0; i < 4; i++) {
                    var ptr = i * width, ptr_end = (i + 1) * width, buf, count;
                    while (ptr < ptr_end) {
                        buf = d8.slice(pos, pos += 2);
                        if (buf[0] > 128) { count = buf[0] - 128; while (count-- > 0) scanline[ptr++] = buf[1]; }
                        else { count = buf[0] - 1; scanline[ptr++] = buf[1]; while (count-- > 0) scanline[ptr++] = d8[pos++]; }
                    }
                }
                for (var i = 0; i < width; i++) { img[ipos++] = scanline[i]; img[ipos++] = scanline[i + width]; img[ipos++] = scanline[i + 2 * width]; img[ipos++] = scanline[i + 3 * width]; }
            }
        }
        completion && completion(img, width, height);
    }
    req.open("GET", url, true);
    req.send(null);
    return req;
}

/*****************/
