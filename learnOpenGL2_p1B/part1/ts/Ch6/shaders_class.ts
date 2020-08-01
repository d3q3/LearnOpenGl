import { vs_shader, fs_shader } from "../../js/Ch6/shaders/index.js"
import { Shader } from "../../js/common/Shader.js";

// settings

const sizeFloat = 4;

// global variables
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let VAO: WebGLVertexArrayObject;
let ourShader: Shader;

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

    // build and compile our shader program
    // ------------------------------------
    ourShader = new Shader(gl, vs_shader, fs_shader); // you can name your shader files however you like

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    let vertices = new Float32Array([
        // positions         // colors
        0.5, - 0.5, 0.0, 1.0, 0.0, 0.0,  // bottom right
        -0.5, -0.5, 0.0, 0.0, 1.0, 0.0,  // bottom left
        0.0, 0.5, 0.0, 0.0, 0.0, 1.0   // top 
    ]);


    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
    gl.bindVertexArray(VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    // position attribute
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 6 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    // color attribute
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 6 * sizeFloat, (3 * sizeFloat));
    gl.enableVertexAttribArray(1);

    // You can unbind the VAO afterwards so other VAO calls won't accidentally modify this VAO, but this rarely happens. Modifying other
    // VAOs requires a call to glBindVertexArray anyways so we generally don't unbind VAOs (nor VBOs) when it's not directly necessary.
    // gl.bindVertexArray(null);

    requestAnimationFrame(render);
}();

// render loop
function render() {
    // input
    // -----
    processInput();

    // render
    // ------
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // render the triangle
    ourShader.use(gl);
    gl.bindVertexArray(VAO);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    //if wanted...
    requestAnimationFrame(render);
}



// process all input: query GLFW whether relevant keys are pressed/released this frame and react accordingly
// ---------------------------------------------------------------------------------------------------------
function processInput() {
    // if (glfwGetKey(window, GLFW_KEY_ESCAPE) == GLFW_PRESS)
    //     glfwSetWindowShouldClose(window, true);
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
