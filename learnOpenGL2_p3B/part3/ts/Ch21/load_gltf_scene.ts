import { vs_materials, fs_materials } from "../../js/Ch21/shaders/index.js";
import { vec3, mat4 } from "../../../math/glmatrix/index.js";
import { Shader } from "../../js/common/Shader.js";
import { Camera, CameraMovement } from "../../js/common/Camera.js";
import { KeyInput } from "../../js/common/KeyInput.js";
import { Mouse } from "../../js/common/Mouse.js";
import { VertexObject, Accessor } from "../../js/geometry/VertexObjects.js";
import { GltfLoader, GltfResource } from "../../js/geometry/GltfLoader.js";
import { GltfModel, GltfMesh, GltfScene, GltfNode, GltfCamera, GltfVertexObject } from "../geometry/GltfModel.js";


// settings
const sizeFloat = 4;
//D3Q: the keyboard-keys the program reacts to; the keyInput gets queried
const GLFW_KEY_W = 'w', GLFW_KEY_S = 's', GLFW_KEY_A = 'a', GLFW_KEY_D = 'd',
    GLFW_KEY_SPACE = ' ';


// camera
let camera: Camera;
let gltfCamera: GltfCamera;

// timing
let deltaTime: number = 0.0;	// time between current frame and last frame
let lastFrame: number = 0.0;

// global variables 
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
//let glMeshes: GlMesh[];
let glScene: GlScene;
let cubeVAO: WebGLVertexArrayObject;
let lightVAO: WebGLVertexArrayObject;
let lightingShader: Shader;
//let lampShader: Shader;
let cubePositions: vec3[];
let keyInput: KeyInput;
let mouse: Mouse;

// lighting
let lightPos = vec3.fromValues(5, 7, 60.0);

// load our mesh
//let gltfUrl = "../../models/cyborg/cyborg.gltf"; //scaleModel = 1.0
let gltfUrl = "../../models/cyborgObjCam/cyborgObjCam.gltf"; //scaleModel = 1.0
//let gltfUrl = "../../models/2CylinderEngine/gltf/2CylinderEngine.gltf"; //scaleModel = 0.01

let scaleModel = 1.0; //0.01;

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

    keyInput = new KeyInput({
        GLFW_KEY_W, GLFW_KEY_S, GLFW_KEY_A, GLFW_KEY_D,
        GLFW_KEY_SPACE
    });

    // D3Q: process all mouse input using callbacks
    mouse = new Mouse();
    mouse.moveCallback = mouseMoveCallback;
    mouse.scrollCallback = mouseScrollCallback;



    let gltfLoader = new GltfLoader();
    let promGltf = gltfLoader.load(gltfUrl);
    promGltf.then((res: GltfResource) => resourcesLoaded(res)).catch(error => alert(error.message));
}();

function resourcesLoaded(res: GltfResource): void {
    let model = new GltfModel(res);
    let scene: GltfScene = model.getScene(0);

    camera = new Camera(vec3.fromValues(0.0, 0.0, 10.0), vec3.fromValues(0.0, 1.0, 0.0));
    let cameras: GltfCamera[] = scene.getCameraNodes();
    if (cameras) { gltfCamera = cameras[0] };
    if (gltfCamera) {
        let v = gltfCamera.getView();
        let t = gltfCamera.getPosition();
        // We have no SetView method on our camera!
        // camera.SetView(v);
        // camera.Position = t;
    }

    glScene = new GlScene(model, scene);

    afterLoad();
}

/**
 * GlMesh has 0 or more 'primitives'/vertexObject with a vao
 */
class GlMesh {
    vaos = [];
    vos: GltfVertexObject[] = [];
}

/**
 * a mesh can be referenced more than once in a scene having different ppMatrices
 */
class DrawMesh {
    glMesh: GlMesh;
    ppMatrix: mat4;
}

class GlScene {
    drawMeshes: DrawMesh[];

    glBuffers: WebGLBuffer[];
    glMeshes: GlMesh[];

    constructor(model: GltfModel, scene: GltfScene) {
        // D3Q: for every bufferView there is one glBuffer
        this.glBuffers = new Array(model.bufferViews.length);
        // D3Q: for every mesh there is one glMesh
        this.glMeshes = new Array(model.meshes.length);

        let meshNodes: GltfNode[] = scene.getMeshNodes();
        this.drawMeshes = new Array(meshNodes.length);

        for (let i = 0, ilen = meshNodes.length; i < ilen; i++) {
            let mesh: GltfMesh = meshNodes[i].getMesh(false);
            let drawMesh = new DrawMesh();

            if (!this.glMeshes[mesh.id]) {
                this.glMeshes[mesh.id] = this.createGlMesh(model, mesh);
            }
            drawMesh.ppMatrix = meshNodes[i].ppMatrix;
            drawMesh.glMesh = this.glMeshes[mesh.id];
            this.drawMeshes[i] = drawMesh;
        }
    }

    private createGlMesh(model: GltfModel, mesh: GltfMesh): GlMesh {
        let glMesh = new GlMesh();

        // create a vao for every vertexObject in a mesh
        for (let j = 0, jlen = mesh.vertexObjects.length; j < jlen; j++) {
            let vo = mesh.vertexObjects[j];

            let mat = vo.material;
            // get layout for material, for now default, material = null:
            let layout = { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 };

            let vao = gl.createVertexArray();
            gl.bindVertexArray(vao);

            let ib = vo.indexAccessor.bufferId;
            if (!this.glBuffers[ib]) {
                const ebo: WebGLBuffer = gl.createBuffer();
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);

                this.glBuffers[ib] = ebo;
            }
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffers[ib]);

            let acc: Accessor;

            // POSITION
            acc = vo.accessors[vo.attributes.POSITION];
            this.createGlVertexBuffer(model, acc);
            gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffers[acc.bufferId]);
            gl.vertexAttribPointer(layout.POSITION, acc.countComponent, gl.FLOAT,
                false, acc.stride, acc.byteOffset);
            gl.enableVertexAttribArray(layout.POSITION);

            // TEXTURE
            if (layout.TEXCOORD_0 !== undefined) {
                if (vo.attributes.TEXCOORD_0 !== undefined) {
                    acc = vo.accessors[vo.attributes.TEXCOORD_0];
                    this.createGlVertexBuffer(model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffers[acc.bufferId]);
                    gl.vertexAttribPointer(layout.TEXCOORD_0, acc.countComponent,
                        gl.FLOAT, false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.TEXCOORD_0);
                }
            }
            // NORMAL
            if (layout.NORMAL !== undefined) {
                if (vo.attributes.NORMAL !== undefined) {
                    acc = vo.accessors[vo.attributes.NORMAL];
                    this.createGlVertexBuffer(model, acc);
                    gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffers[acc.bufferId]);
                    acc = vo.accessors[vo.attributes.NORMAL];
                    gl.vertexAttribPointer(layout.NORMAL, acc.countComponent, gl.FLOAT,
                        false, acc.stride, acc.byteOffset);
                    gl.enableVertexAttribArray(layout.NORMAL);
                }
            }
            glMesh.vaos.push(vao);
            glMesh.vos.push(vo);
        }
        return glMesh;
    }

    /**
     * creates the vbo if necessary.
     * @param model for bufferviews
     * @param acc the accessorfor the bufferview
     */
    createGlVertexBuffer(model: GltfModel, acc: Accessor) {
        let ib = acc.bufferId;
        if (!this.glBuffers[ib]) {
            let vbo = gl.createBuffer();
            gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
            gl.bufferData(gl.ARRAY_BUFFER, model.bufferViews[ib].data, gl.STATIC_DRAW);
            this.glBuffers[ib] = vbo;
        }
    }
}

function afterLoad() {
    // configure global opengl state
    // -----------------------------
    gl.enable(gl.DEPTH_TEST);

    // build and compile our shader zprogram
    // ------------------------------------
    lightingShader = new Shader(gl, vs_materials, fs_materials);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // already done in resourceLoaded()

    requestAnimationFrame(render);
}

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
    gl.clearColor(0.3, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // be sure to activate shader when setting uniforms/drawing objects
    lightingShader.use(gl);
    setVec3vShader(lightingShader, "light.position", lightPos);
    // let pos;
    // gltfCamera ? pos = gltfCamera.getPosition() : pos = camera.Position;
    setVec3vShader(lightingShader, "viewPos", camera.Position);

    // light properties
    let lightColor = vec3.create();
    lightColor[0] = 0.5;
    lightColor[1] = 0.5;
    lightColor[2] = 0.5;
    let diffuseColor = componentProduct3(lightColor, vec3.fromValues(0.5, 0.5, 0.5)); // decrease the influence
    let ambientColor = componentProduct3(diffuseColor, vec3.fromValues(0.2, 0.2, 0.2)); // low influence
    setVec3vShader(lightingShader, "light.ambient", ambientColor);
    setVec3vShader(lightingShader, "light.diffuse", diffuseColor);
    lightingShader.setFloat3(gl, "light.specular", 1.0, 1.0, 1.0);

    // material properties
    lightingShader.setFloat3(gl, "material.ambient", 1.0, 0.5, 0.31);
    lightingShader.setFloat3(gl, "material.diffuse", 0.8, 0.8, 0.8);
    lightingShader.setFloat3(gl, "material.specular", 0.5, 0.5, 0.5);
    lightingShader.setFloat(gl, "material.shininess", 8.0);

    // view/projection transformations
    let projection = mat4.create();
    mat4.perspective(projection, (camera.Zoom) * Math.PI / 180, canvas.width / canvas.height, 0.1, 100.0);

    let view: mat4;
    // gltfCamera ? view = gltfCamera.getView() : 
    view = camera.GetViewMatrix();

    setMat4vShader(lightingShader, "projection", projection);
    setMat4vShader(lightingShader, "view", view);

    // render the gltf model
    for (let i = 0, ilen = glScene.drawMeshes.length; i < ilen; i++) {
        // world transformation
        let model: mat4 = mat4.clone(glScene.drawMeshes[i].ppMatrix);
        let scale: mat4 = mat4.create();
        mat4.fromScaling(scale, vec3.fromValues(scaleModel, scaleModel, scaleModel));
        mat4.multiply(model, scale, model);
        setMat4vShader(lightingShader, "model", model);

        let m: DrawMesh = glScene.drawMeshes[i];
        for (let j = 0; j < m.glMesh.vaos.length; j++) {
            gl.bindVertexArray(m.glMesh.vaos[j]);
            gl.drawElements(gl.TRIANGLES, m.glMesh.vos[j].indexAccessor.countElements,
                gl.UNSIGNED_SHORT, m.glMesh.vos[j].indexAccessor.byteOffset);
        }
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