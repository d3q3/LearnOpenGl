import { vs_materials, fs_materials } from "../../js/Ch48/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { Glyph, GlyphVertexObject } from "../../js/geometry/Glyph.js";


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
let glyphVAOS: WebGLVertexArrayObject[];
let lightingShader: Shader;
let keyInput: KeyInput;
let mouse: Mouse;
let glyphObjects: GlyphVertexObject[];
let glyphTranslations;
let fontResolution;

// lighting
let lightPos = vec3.fromValues(0.5, 0.7, 2.0);


let main = function () {
    // canvas getting from document and initializing OpenGL context 
    canvas = document.querySelector('#canvas1');

    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
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
    gl.disable(gl.DEPTH_TEST);

    // build and compile our shader zprogram
    // ------------------------------------
    lightingShader = new Shader(gl, vs_materials, fs_materials);
    // next fonts OK, checked using text: let name = "AsjgABDEQijgqkrsux3";
    //fetch("../../fonts/Three/optimer_regular.typeface.json") // OK+
    //fetch("../../fonts/stix2-otf/STIX Two Text_Regular.json") // OK; ttf=false
    //fetch("../../fonts/stix2-otf/STIX Two Math_Regular.json") // OK op math name test; ttf=false
    //fetch("../../fonts/baskervillef/BaskervilleF_Regular.json") // OK+; ttf=false
    //fetch("../../fonts/Three/gentilis_regular.typeface.json") // OK+
    //fetch("../../fonts/Three/helvetiker_regular.typeface.json") // OK+
    //fetch("../../fonts/SourceSansPro/Source Sans Pro Black_Regular.json") //...
    ////    small g problem. small q: inner contour ends below start: not my problem; changed data last bezier, now it works
    //fetch("../../fonts/SourceSansPro/Source Sans Pro Light_Regular.json") // OK+
    fetch("../../fonts/AlexBrush/Alex Brush_Regular.json") // OK+
        //fetch("../../fonts/LearningCurve/Learning Curve_Regular.json") // OK+, better than _ps version (capital A)
        //fetch("../../fonts/LearningCurve/Learning Curve_Regular_ps.json") // OK+; ttf=false
        //fetch("../../fonts/TurnTable/Turn Table_Regular.json") // OK
        //fetch("../../fonts/Synthetique/Synthetique_Regular.json") // OK

        //fetch("../../fonts/CatsAlphabet/CatsAlphabet_Regular.json") // NOT!!! OK; ttf=false; large triangle count

        .then(response => response.json())
        .then(data => afterLoad(data));
}();

function afterLoad(jsonFont) {
    // for a normal test
    let name = "sjgABDEQijgqkrsux3";

    // for cats font
    //let name = "ABCDEFGHIGKLMNOPQRSTUVWXYZ";

    //for math font
    //let name = "\u2205\u2206\u2207\u2208\u2209\u220A\u220B\u220C\u220D\u220E\u220F\u2210\u2211"

    glyphVAOS = [];
    glyphObjects = [];
    glyphTranslations = [];
    fontResolution = jsonFont.resolution ? jsonFont.resolution : 1024;

    let startTranslation = - 2 * fontResolution;
    for (let i = 0, il = name.length; i < il; i++) {

        let c = name.charAt(i);
        let jsonGlyph = jsonFont.glyphs[c];
        if (!jsonGlyph) { startTranslation += fontResolution; continue; }

        console.log(jsonGlyph.o);
        let glyph: Glyph = new Glyph(jsonGlyph, true);
        for (let j = 0; j < glyph.ids; j++) {
            glyphTranslations.push(startTranslation);

            let vo = glyph.createVertexObject(j);
            glyphObjects.push(vo);

            // crete GL vertex object
            let glyphVAO = gl.createVertexArray()
            glyphVAOS.push(glyphVAO);
            let VBO = gl.createBuffer();
            let EBO = gl.createBuffer();
            gl.bindVertexArray(glyphVAO);

            gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
            gl.bufferData(gl.ARRAY_BUFFER, vo.vertices, gl.STATIC_DRAW);

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, EBO);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(vo.indices), gl.STATIC_DRAW);

            // position attribute
            gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * sizeFloat, 0);
            gl.enableVertexAttribArray(0);
            // normal attribute
            gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * sizeFloat, (3 * sizeFloat));
            gl.enableVertexAttribArray(1);
        }
        startTranslation += glyph.horizAdv;
    }
    requestAnimationFrame(render);
}

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
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    setVec3vShader(lightingShader, "viewPos", camera.Position);

    // light properties
    let lightColor = vec3.create();
    lightColor[0] = 1.0;
    lightColor[1] = 1.0;
    lightColor[2] = 1.0;
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.8, 0.8, 0.8)); // decrease the influence
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.4, 0.4, 0.4)); // low influence
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);

    // material properties
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 1.0, 0.8, 0.8);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 8.0);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);
    let view: mat4 = camera.GetViewMatrix();
    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);


    // render the glyphs
    for (let i = 0; i < glyphVAOS.length; i++) {
        let model: mat4 = mat4.create();
        // world transformation
        mat4.scale(model, model, [2 / fontResolution, 2 / fontResolution, 2 / fontResolution])
        mat4.translate(model, model, vec3.fromValues(glyphTranslations[i], 0, 0));
        setMat4vShader(lightingShader, "model", model);

        gl.bindVertexArray(glyphVAOS[i]);
        gl.drawElements(gl.TRIANGLES, glyphObjects[i].indices.length,
            gl.UNSIGNED_SHORT, 0);
    }
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