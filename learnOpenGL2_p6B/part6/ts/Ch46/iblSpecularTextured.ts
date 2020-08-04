import { vec3, mat4 } from '../../../math/glmatrix/index.js';
import {
    vs_pbr, fs_pbr,
    vs_background, fs_background,
    vs_cubemap, fs_equirectangularToCubemap,
    fs_prefilter,
    vs_brdf, fs_brdf,
    fs_irradianceConvolution
} from '../../js/Ch46/shaders/2/index.js';
import { Shader } from '../../js/common/Shader.js'
import { Mouse } from '../../js/common/Mouse.js'
import { KeyInput } from '../../js/common/KeyInput.js';
import { Camera, CameraMovement } from '../../js/common/Camera.js';
import { Geometry, Sphere, Cube, Quad } from '../../js/geometry/geometry.js';

/**
 *
 * D3Q: javascript version of part of Ch46 program in LearnOpenGL
 * rewrite of  ibl_specular_textured.cpp.
 *
 */

const sizeFloat = 4;

const whCube = 512;

// settings
const SCR_WIDTH = 1280;
const SCR_HEIGHT = 720;

// creating window (canvas) and rendering context (gl)
let canvas = document.createElement('canvas');
canvas.width = SCR_WIDTH; //window.innerWidth;
canvas.height = SCR_HEIGHT;// window.innerHeight;
document.body.appendChild(canvas);

var displayError = function (html) {
    var div = document.createElement('div');

    div.innerHTML = [
        '<table style="background-color: #8CE; width: 100%; height: 10pt;">',
        '  <tr>',
        '      <td align="center">',
        '          <div style="display: table-cell; vertical-align: middle;">',
        '              <div style="">' + html + '</div>',
        '          </div>',
        '      </td>',
        '  </tr>',
        '</table>'
    ].join('\n');

    document.body.appendChild(div);
};

var gl: WebGL2RenderingContext = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}

var glVersion = gl.getParameter(gl.VERSION);
if (glVersion) {
    displayError(glVersion)
    console.log(glVersion);
}

var glslVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
if (glslVersion) {
    console.log(glslVersion);
}

let showCubeMap: boolean = true;
let spacePressed: boolean = false;

//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';
let keyInput = new KeyInput({
    GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
    GLFW_KEY_SPACE
});

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {

    // camera.aspect = window.innerWidth / window.innerHeight;
    // camera.updateProjectionMatrix();

    // renderer.setSize(window.innerWidth, window.innerHeight);

}



//D3Q: global variables used in both main() and render()
let pbrShader: Shader = null;
let equirectangularToCubemapShader: Shader = null;
let irradianceShader: Shader = null;
let prefilterShader: Shader = null;
let brdfShader: Shader = null;
let backgroundShader: Shader = null;

//iron
let ironAlbedoMap = null;
let ironNormalMap = null;
let ironMetallicMap = null;
let ironRoughnessMap = null;
let ironAOMap = null;

// gold
let goldAlbedoMap = null;
let goldNormalMap = null;
let goldMetallicMap = null;
let goldRoughnessMap = null;
let goldAOMap = null;

// grass
let grassAlbedoMap = null;
let grassNormalMap = null;
let grassMetallicMap = null;
let grassRoughnessMap = null;
let grassAOMap = null;

// plastic
let plasticAlbedoMap = null;
let plasticNormalMap = null;
let plasticMetallicMap = null;
let plasticRoughnessMap = null
let plasticAOMap = null;

// wall
let wallAlbedoMap = null;
let wallNormalMap = null;
let wallMetallicMap = null;
let wallRoughnessMap = null;
let wallAOMap = null;


let projection: mat4 = mat4.create(), view: mat4 = mat4.create(); let model = mat4.create();
let lightPositions: Float32Array = null;
let lightColors: Float32Array = null;

const nrRows = 7;
const nrColumns = 7;
const spacing = 2.5;

let cubeVAO = null;
let cube: Cube;
let quadVAO = null;
let quad: Quad;
let envCubemap = null;
let sphereVAO: WebGLVertexArrayObject = null;
let sphere: Sphere;
let captureFBO = null;
let irradianceMap = null;
let prefilterMap = null;
let brdfLUTTexture = null;


// camera
let camera = new Camera(vec3.fromValues(0.0, 0.0, 3.0), vec3.fromValues(0.0, 1.0, 0.0));

// timing
let deltaTime: number = 0.0;
let lastFrame: number = 0.0;

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
    // enable seamless cubemap sampling for lower mip levels in the pre-filter map.
    // gl.enable(gl.TEXTURE_CUBE_MAP_SEAMLESS);
    // D3Q: default behaviour in WebGL2??

    // build and compile shaders
    // -------------------------
    pbrShader = new Shader(gl, vs_pbr, fs_pbr);
    equirectangularToCubemapShader = new Shader(gl, vs_cubemap, fs_equirectangularToCubemap);
    irradianceShader = new Shader(gl, vs_cubemap, fs_irradianceConvolution);
    prefilterShader = new Shader(gl, vs_cubemap, fs_prefilter);
    brdfShader = new Shader(gl, vs_brdf, fs_brdf);
    backgroundShader = new Shader(gl, vs_background, fs_background);

    pbrShader.use(gl);
    pbrShader.setInt(gl, "irradianceMap", 0);
    pbrShader.setInt(gl, "prefilterMap", 1);
    pbrShader.setInt(gl, "brdfLUT", 2);
    pbrShader.setInt(gl, "albedoMap", 3);
    pbrShader.setInt(gl, "normalMap", 4);
    pbrShader.setInt(gl, "metallicMap", 5);
    pbrShader.setInt(gl, "roughnessMap", 6);
    pbrShader.setInt(gl, "aoMap", 7);

    backgroundShader.use(gl);
    backgroundShader.setInt(gl, "environmentMap", 0);

    // load PBR material textures
    // --------------------------
    // rusted iron
    ironAlbedoMap = loadTexture("../../textures/Ch46/rusted_iron/albedo.png", 4, false);
    ironNormalMap = loadTexture("../../textures/Ch46/rusted_iron/normal.png", 4, false);
    ironMetallicMap = loadTexture("../../textures/Ch46/rusted_iron/metallic.png", 4, false);
    ironRoughnessMap = loadTexture("../../textures/Ch46/rusted_iron/roughness.png", 4, false);
    ironAOMap = loadTexture("../../textures/Ch46/rusted_iron/ao.png", 4, false);

    // gold
    goldAlbedoMap = loadTexture("../../textures/Ch46/gold/albedo.png", 4, false);
    goldNormalMap = loadTexture("../../textures/Ch46/gold/normal.png", 4, false);
    goldMetallicMap = loadTexture("../../textures/Ch46/gold/metallic.png", 4, false);
    goldRoughnessMap = loadTexture("../../textures/Ch46/gold/roughness.png", 4, false);
    goldAOMap = loadTexture("../../textures/Ch46/gold/ao.png", 4, false);

    // grass
    grassAlbedoMap = loadTexture("../../textures/Ch46/grass/albedo.png", 4, false);
    grassNormalMap = loadTexture("../../textures/Ch46/grass/normal.png", 4, false);
    grassMetallicMap = loadTexture("../../textures/Ch46/grass/metallic.png", 4, false);
    grassRoughnessMap = loadTexture("../../textures/Ch46/grass/roughness.png", 4, false);
    grassAOMap = loadTexture("../../textures/Ch46/grass/ao.png", 4, false);

    // plastic
    plasticAlbedoMap = loadTexture("../../textures/Ch46/plastic/albedo.png", 4, false);
    plasticNormalMap = loadTexture("../../textures/Ch46/plastic/normal.png", 4, false);
    plasticMetallicMap = loadTexture("../../textures/Ch46/plastic/metallic.png", 4, false);
    plasticRoughnessMap = loadTexture("../../textures/Ch46/plastic/roughness.png", 4, false);
    plasticAOMap = loadTexture("../../textures/Ch46/plastic/ao.png", 4, false);

    // wall
    wallAlbedoMap = loadTexture("../../textures/Ch46/wall/albedo.png", 4, false);
    wallNormalMap = loadTexture("../../textures/Ch46/wall/normal.png", 4, false);
    wallMetallicMap = loadTexture("../../textures/Ch46/wall/metallic.png", 4, false);
    wallRoughnessMap = loadTexture("../../textures/Ch46/wall/roughness.png", 4, false);
    wallAOMap = loadTexture("../../textures/Ch46/wall/ao.png", 4, false);

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

    // load the HDR environment map
    loadHDR("../../textures/hdr/newport_loft.hdr", toCubemap);
}();

function toCubemap(data, width, height) {
    // pbr: setup framebuffer
    captureFBO = gl.createFramebuffer();
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
    // 0	gl.TEXTURE_CUBE_MAP_POSITIVE_X
    // 1	gl.TEXTURE_CUBE_MAP_NEGATIVE_X
    // 2	gl.TEXTURE_CUBE_MAP_POSITIVE_Y
    // 3	gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
    // 4	gl.TEXTURE_CUBE_MAP_POSITIVE_Z
    // 5	gl.TEXTURE_CUBE_MAP_NEGATIVE_Z
    for (let i = 0; i < 6; ++i) {

        // works! Alpha channel needed when using framebuffers?
        // see Ch45... IblIrradiance.ts
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F,
            whCube, whCube, 0, gl.RGBA, gl.FLOAT, new Float32Array(whCube * whCube * 4));

    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // pbr: set up projection and view matrices for capturing data onto the 6 cubemap face directions
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
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(equirect) status error= " + error);
    for (let i = 0; i < 6; ++i) {
        gl.uniformMatrix4fv(gl.getUniformLocation(equirectangularToCubemapShader.programId, "view"), false, captureViews[i]);
        // D3Q: use one of the six buffers of envCubeMap as colorbuffer of captureFBO
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, envCubemap, 0);
        let error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(equirect-texture) status error= " + error);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //gl.clear(gl.DEPTH_BUFFER_BIT);
        renderCube();
    }
    // D3Q: now all faces in envCubemap are written to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // then let OpenGL generate mipmaps from first mip face (combatting visible dots artifact)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);


    // pbr: create an irradiance cubemap, and re-scale capture FBO to irradiance scale.
    const whIrradiance = 32;
    irradianceMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
    for (let i = 0; i < 6; ++i) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA16F,
            whIrradiance, whIrradiance, 0, gl.RGBA, gl.FLOAT, new Float32Array(whIrradiance * whIrradiance * 4));
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, whIrradiance, whIrradiance);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(irradiance-depth) status error= " + error);


    // pbr: solve diffuse integral by convolution to create an irradiance (cube)map.
    irradianceShader.use(gl);
    irradianceShader.setInt(gl, "environmentMap", 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(irradianceShader.programId, "projection"), false, captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

    gl.viewport(0, 0, whIrradiance, whIrradiance); // don't forget to configure the viewport to the capture dimensions.
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(irradiance) status error= " + error);

    for (let i = 0; i < 6; ++i) {
        gl.uniformMatrix4fv(gl.getUniformLocation(irradianceShader.programId, "view"), false, captureViews[i]);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, irradianceMap, 0);
        error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(irradiance-texture) status error= " + error);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        renderCube();
    }
    // D3Q: now all faces in irradianceMap are written to.
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // D3Q: now we make first a prefilterMap and then the bdrfLuttMap 
    // --------------------------------------------------------------


    // pbr: create a pre-filter cubemap, and re-scale capture FBO to pre-filter scale.
    // --------------------------------------------------------------------------------
    const whPre = 128;
    prefilterMap = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);
    // D3Q: the original code works with floats instead of uints.
    // See: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/texImage2D
    // For mipmaps: use a general format like RGBA or a sized format (webgl2) that is both
    // renderable and filterable.
    for (let i = 0; i < 6; ++i) {
        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGB, whPre, whPre, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array(whPre * whPre * 3));
    }
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); // be sure to set minifcation filter to mip_linear 
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    // generate mipmaps for the cubemap so OpenGL automatically allocates the required memory.
    gl.generateMipmap(gl.TEXTURE_CUBE_MAP);

    // pbr: run a quasi monte-carlo simulation on the environment lighting to create a prefilter (cube)map.
    // ----------------------------------------------------------------------------------------------------
    prefilterShader.use(gl);
    prefilterShader.setInt(gl, "environmentMap", 0);
    gl.uniformMatrix4fv(gl.getUniformLocation(prefilterShader.programId, "projection"), false, captureProjection);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);

    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(prefilter) status error= " + error);

    const maxMipLevels = 5;
    for (let mip = 0; mip < maxMipLevels; ++mip) {
        // reisze framebuffer according to mip-level size.
        let mipWidth = 128 * Math.pow(0.5, mip);
        let mipHeight = 128 * Math.pow(0.5, mip);
        gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, mipWidth, mipHeight);
        error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(prefilter-depth) status error= " + error);

        gl.viewport(0, 0, mipWidth, mipHeight);

        let roughness = mip / (maxMipLevels - 1);
        prefilterShader.setFloat(gl, "roughness", roughness);
        for (let i = 0; i < 6; ++i) {

            gl.uniformMatrix4fv(gl.getUniformLocation(prefilterShader.programId, "view"), false, captureViews[i]);
            // prefilterShader.setMat4("view", captureViews[i]);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, prefilterMap, mip);
            error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
            if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(prefilter-texture) status error= " + error);

            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            renderCube();
        }
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);


    // pbr: generate a 2D LUT from the BRDF equations used.
    // ----------------------------------------------------
    brdfLUTTexture = gl.createTexture();

    // pre-allocate enough memory for the LUT texture.
    gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RG16F, whCube, whCube, 0, gl.RG, gl.FLOAT, new Float32Array(whCube * whCube * 2), 0);
    // be sure to set wrapping mode to gl.CLAMP_TO_EDGE
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    // then re-configure capture framebuffer object and render screen-space quad with BRDF shader.
    gl.bindFramebuffer(gl.FRAMEBUFFER, captureFBO);
    gl.bindRenderbuffer(gl.RENDERBUFFER, captureRBO);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, whCube, whCube);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(brdf-depth) status error= " + error);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, brdfLUTTexture, 0);
    error = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (error != gl.FRAMEBUFFER_COMPLETE) console.log("framebuf(brdf-tetxure) status error= " + error);

    gl.viewport(0, 0, whCube, whCube);
    brdfShader.use(gl);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    renderQuad();

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    // initialize static shader uniforms before rendering
    // --------------------------------------------------
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, SCR_WIDTH / SCR_HEIGHT, 0.1, 100.0);
    pbrShader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "projection"), false, projection)
    //pbrShader.setMat4("projection", projection);

    //D3Q: missing in original code:
    gl.uniform3fv(gl.getUniformLocation(pbrShader.programId, "lightPositions"), lightPositions);
    gl.uniform3fv(gl.getUniformLocation(pbrShader.programId, "lightColors"), lightColors);


    backgroundShader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(backgroundShader.programId, "projection"), false, projection);
    //backgroundShader.setMat4("projection", projection);

    // then before rendering, configure the viewport to the original framebuffer's screen dimensions
    // let scrWidth = SCR_WIDTH, scrHeight = SCR_HEIGHT;
    //glfwGetFramebufferSize(window, & scrWidth, & scrHeight);
    gl.viewport(0, 0, canvas.width, canvas.height);

    // render loop
    animate();
}

function animate() {
    //updateScene();
    render();
    requestAnimationFrame(animate);
}

function render() {
    let currentFrame = performance.now();
    deltaTime = currentFrame - lastFrame;
    lastFrame = currentFrame;

    processInput();

    // render
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    pbrShader.use(gl);
    view = camera.GetViewMatrix();
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "view"), false, view);
    gl.uniform3fv(gl.getUniformLocation(pbrShader.programId, "camPos"),
        new Float32Array(camera.Position));

    // bind pre-computed IBL data
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, prefilterMap);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, brdfLUTTexture);

    // rusted iron
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, ironAlbedoMap);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, ironNormalMap);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, ironMetallicMap);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, ironRoughnessMap);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, ironAOMap);

    model = mat4.create()
    model = mat4.translate(model, model, vec3.fromValues(-5.0, 0.0, 2.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
    renderSphere();

    // gold
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, goldAlbedoMap);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, goldNormalMap);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, goldMetallicMap);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, goldRoughnessMap);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, goldAOMap);

    model = mat4.create()
    model = mat4.translate(model, model, vec3.fromValues(-3.0, 0.0, 2.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
    renderSphere();

    // grass
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, grassAlbedoMap);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, grassNormalMap);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, grassMetallicMap);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, grassRoughnessMap);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, grassAOMap);

    model = mat4.create()
    model = mat4.translate(model, model, vec3.fromValues(-1.0, 0.0, 2.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
    renderSphere();

    // plastic
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, plasticAlbedoMap);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, plasticNormalMap);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, plasticMetallicMap);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, plasticRoughnessMap);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, plasticAOMap);

    model = mat4.create()
    model = mat4.translate(model, model, vec3.fromValues(1.0, 0.0, 2.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
    renderSphere();

    // wall
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, wallAlbedoMap);
    gl.activeTexture(gl.TEXTURE4);
    gl.bindTexture(gl.TEXTURE_2D, wallNormalMap);
    gl.activeTexture(gl.TEXTURE5);
    gl.bindTexture(gl.TEXTURE_2D, wallMetallicMap);
    gl.activeTexture(gl.TEXTURE6);
    gl.bindTexture(gl.TEXTURE_2D, wallRoughnessMap);
    gl.activeTexture(gl.TEXTURE7);
    gl.bindTexture(gl.TEXTURE_2D, wallAOMap);

    model = mat4.create()
    model = mat4.translate(model, model, vec3.fromValues(3.0, 0.0, 2.0));
    gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
    renderSphere();

    // render light source (simply re-render sphere at light positions)
    // this looks a bit off as we use the same shader, but it'll make their positions obvious and 
    // keeps the codeprint small.
    for (let i = 0; i < lightPositions.length / 3; ++i) {
        //let newPos: vec3 = lightPositions[i] + glm:: vec3(sin(glfwGetTime() * 5.0) * 5.0, 0.0, 0.0);
        let newPos: vec3 = vec3.fromValues(lightPositions[3 * i], lightPositions[3 * i + 1], lightPositions[3 * i + 2]);

        mat4.identity(model);
        mat4.translate(model, model, newPos);
        mat4.scale(model, model, vec3.fromValues(0.5, 0.5, 0.5));
        gl.uniformMatrix4fv(gl.getUniformLocation(pbrShader.programId, "model"), false, model);
        renderSphere();
    }

    // render skybox (render as last to prevent overdraw)
    backgroundShader.use(gl);
    gl.uniformMatrix4fv(gl.getUniformLocation(backgroundShader.programId, "view"), false, view);
    gl.activeTexture(gl.TEXTURE0);
    if (showCubeMap)
        // display cubemap
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, envCubemap);
    else
        // display irradiance map
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, irradianceMap);
    renderCube();
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

    // D3Q:toggel
    if ((keyInput.isDown(GLFW_KEY_SPACE) == GLFW_PRESS)) {
        if (!spacePressed) {
            spacePressed = true;
            showCubeMap = !showCubeMap;
        }
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


/**
 * D3Q: Creates a GL vertexarray object for a geometry.
 * @param geo a subclass of Geometry
 * @param layout an object with the layout of attributes in the shader
 */
let CreateVAO = function (geo: Geometry, layout: any) {
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
    gl.vertexAttribPointer(layout.POSITION, acc.count, gl.FLOAT, false, acc.stride, acc.offset);
    gl.enableVertexAttribArray(layout.POSITION);

    // TEXTURE
    if (layout.TEXCOORD_0) {
        acc = geo.accessors[geo.attributes.TEXCOORD_0];
        gl.vertexAttribPointer(layout.TEXCOORD_0, acc.count, gl.FLOAT, false, acc.stride, acc.offset);
        gl.enableVertexAttribArray(layout.TEXCOORD_0);
    }
    // NORMAL
    if (layout.NORMAL) {
        acc = geo.accessors[geo.attributes.NORMAL];
        gl.vertexAttribPointer(layout.NORMAL, acc.count, gl.FLOAT, false, acc.stride, acc.offset);
        gl.enableVertexAttribArray(layout.NORMAL);
    }
    return VAO;
};


function renderSphere() {
    if (sphereVAO == null) {
        sphere = new Sphere(14, 14);
        sphereVAO = CreateVAO(sphere, { POSITION: 0, TEXCOORD_0: 1, NORMAL: 2 });
    }
    gl.bindVertexArray(sphereVAO);
    gl.drawElements(gl.TRIANGLES, sphere.indices.length, gl.UNSIGNED_SHORT, 0);
}





function renderQuad() {
    if (!quadVAO) {
        quad = new Quad();
        quadVAO = CreateVAO(quad, { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 });

        gl.bindVertexArray(null);
    }
    gl.bindVertexArray(quadVAO);
    //gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.drawElements(gl.TRIANGLES, quad.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}


// renderCube() renders a 1x1 3D cube in NDC.
function renderCube() {
    // initialize (if necessary)
    if (!cubeVAO) {
        cube = new Cube();
        cubeVAO = CreateVAO(cube, { POSITION: 0 });
    }
    // render Cube
    gl.bindVertexArray(cubeVAO);
    gl.drawElements(gl.TRIANGLES, cube.indices.length, gl.UNSIGNED_SHORT, 0);
    gl.bindVertexArray(null);
}








// D3Q: functions--------------------------------------------------


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
