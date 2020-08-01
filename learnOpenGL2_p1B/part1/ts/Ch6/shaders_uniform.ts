
export { }

// settings
const sizeFloat = 4;

const vertexShaderSource = `#version 300 es 
precision mediump float;
layout (location = 0) in vec3 aPos;
void main()
{
   gl_Position = vec4(aPos, 1.0);
}`;

const fragmentShaderSource = `#version 300 es      
precision mediump float;
out vec4 FragColor;
uniform vec4 ourColor;
void main()
{
   FragColor = ourColor;
}`;

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

    window.onresize = () => {
        framebufferSizeCallback(window.innerWidth,
            window.innerHeight)
    }

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

        console.log("ERROR:: SHADER:: VERTEX:: COMPILATION_FAILED\n" +
            gl.getShaderInfoLog(vertexShader)); return;
    }
    // fragment shader
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    // check for shader compile errors
    success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (!success) {

        console.log("ERROR:: SHADER:: FRAGMENT:: COMPILATION_FAILED\n" +
            gl.getShaderInfoLog(fragmentShader)); return;
    }
    // link shaders
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    // check for linking errors
    success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    if (!success) {

        console.log("ERROR:: SHADER:: PROGRAM:: LINKING_FAILED\n" +
            gl.getProgramInfoLog(shaderProgram)); return;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    // set up vertex data (and buffer(s)) and configure vertex attributes
    // ------------------------------------------------------------------
    let vertices = new Float32Array([
        0.5, - 0.5, 0.0,  // bottom right
        -0.5, -0.5, 0.0,  // bottom left
        0.0, 0.5, 0.0   // top 
    ]);



    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    // bind the Vertex Array Object first, then bind and set vertex buffer(s), and then configure vertex attributes(s).
    gl.bindVertexArray(VAO);

    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);

    // You can unbind the VAO afterwards so other VAO calls won't accidentally modify this VAO, but this rarely happens. Modifying other
    // VAOs requires a call to glBindVertexArray anyways so we generally don't unbind VAOs (nor VBOs) when it's not directly necessary.
    // gl.bindVertexArray(null);


    // bind the VAO (it was already bound, but just to demonstrate): seeing as we only have a single VAO we can 
    // just bind it beforehand before rendering the respective triangle; this is another approach.
    gl.bindVertexArray(VAO);

    requestAnimationFrame(render);
}();

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

    // be sure to activate the shader before any calls to glUniform
    gl.useProgram(shaderProgram);

    // update shader uniform
    let timeValue = performance.now() / 1000;
    let greenValue = Math.sin(timeValue) / 2.0 + 0.5;
    let vertexColorLocation = gl.getUniformLocation(shaderProgram, "ourColor");
    gl.uniform4f(vertexColorLocation, 0.0, greenValue, 0.0, 1.0);

    // render the triangle
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // // glfw: swap buffers and poll IO events (keys pressed/released, mouse moved etc.)
    // // -------------------------------------------------------------------------------
    // glfwSwapBuffers(window);
    // glfwPollEvents();

    // here requestAnimationFrame needed: animation of texture in time
    requestAnimationFrame(render);
}

// // optional: de-allocate all resources once they've outlived their purpose:
// // ------------------------------------------------------------------------
// gl.deleteVertexArrays(1, & VAO);
// gl.deleteBuffers(1, & VBO);

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
