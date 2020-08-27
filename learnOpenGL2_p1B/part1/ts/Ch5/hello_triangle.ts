export { }

// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

// settings
const sizeFloat = 4;

const vertexShaderSource = `#version 300 es 
precision mediump float;
layout (location = 0) in vec3 aPos;
    void main()
    {
       gl_Position = vec4(aPos.x, aPos.y, aPos.z, 1.0);
    }`;

const fragmentShaderSource = `#version 300 es 
precision mediump float;
out vec4 FragColor;
void main()
{
    FragColor = vec4(1.0f, 0.5f, 0.2f, 1.0f);
}`

// global variables
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let VAO: WebGLVertexArrayObject;
let shaderProgram: WebGLProgram;

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
    // vertex shader
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    // check for shader compile errors
    let success;

    success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (!success) {
        //gl.getShaderInfoLog(vertexShader, 512, NULL, infoLog);
        console.log("ERROR::SHADER::VERTEX::COMPILATION_FAILED " + gl.getShaderInfoLog(vertexShader)); return;
    }
    // fragment shader
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    // check for shader compile errors
    success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (!success) {
        //gl.getShaderInfoLog(fragmentShader, 512, NULL, infoLog);
        console.log("ERROR::SHADER::FRAGMENT::COMPILATION_FAILED " + gl.getShaderInfoLog(fragmentShader)); return;
    }
    // link shaders
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    // check for linking errors
    success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    if (!success) {
        //gl.getProgramInfoLog(shaderProgram, 512, NULL, infoLog);
        console.log("ERROR::SHADER::PROGRAM::LINKING_FAILED" + gl.getProgramInfoLog(shaderProgram)); return;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    let vertices = new Float32Array([
        - 0.5, -0.5, 0.0, // left  
        0.5, -0.5, 0.0, // right 
        0.0, 0.5, 0.0  // top   
    ]);


    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
    gl.bindVertexArray(VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);

    // note that this is allowed, the call to glVertexAttribPointer registered VBO as the vertex attribute's bound vertex buffer object so afterwards we can safely unbind
    gl.bindBuffer(gl.ARRAY_BUFFER, null);

    // You can unbind the VAO afterwards so other VAO calls won't accidentally modify this VAO, but this rarely happens. Modifying other
    // VAOs requires a call to glBindVertexArray anyways so we generally don't unbind VAOs (nor VBOs) when it's not directly necessary.
    gl.bindVertexArray(null);

    requestAnimationFrame(render);
}();

// uncomment this call to draw in wireframe polygons.
//gl.polygonMode(gl.FRONT_AND_BACK, gl.LINE);

// render loop
// -----------
function render() {
    // input
    // -----
    processInput();

    // render
    // ------
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // draw our first triangle
    gl.useProgram(shaderProgram);
    gl.bindVertexArray(VAO); // seeing as we only have a single VAO there's no need to bind it every time, but we'll do so to keep things a bit more organized
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // gl.indVertexArray(0); // no need to unbind it every time 

    // if wanted...
    //requestAnimationFrame(render);

}

// // optional: de-allocate all resources once they've outlived their purpose:
// // ------------------------------------------------------------------------
// gl.deleteVertexArray(VAO);
// gl.deleteBuffer(VBO);

// // glfw: terminate, clearing all previously allocated GLFW resources.
// // ------------------------------------------------------------------
// glfwTerminate();
// return 0;


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