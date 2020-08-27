// This code is a javascript translation of code originally written by Joey de Vries under the CC BY-NC 4.0 licence. 
// For more information please visit https://learnopengl.com/About

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
let canvas;
let gl;
let VAO;
let shaderProgram;
let main = function () {
    canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    gl = canvas.getContext('webgl2');
    if (!gl) {
        console.log("WebGL 2 needed");
        return;
    }
    window.onresize = () => {
        framebufferSizeCallback(window.innerWidth, window.innerHeight);
    };
    let vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, vertexShaderSource);
    gl.compileShader(vertexShader);
    let success;
    success = gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS);
    if (!success) {
        console.log("ERROR:: SHADER:: VERTEX:: COMPILATION_FAILED\n" +
            gl.getShaderInfoLog(vertexShader));
        return;
    }
    let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, fragmentShaderSource);
    gl.compileShader(fragmentShader);
    success = gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS);
    if (!success) {
        console.log("ERROR:: SHADER:: FRAGMENT:: COMPILATION_FAILED\n" +
            gl.getShaderInfoLog(fragmentShader));
        return;
    }
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    success = gl.getProgramParameter(shaderProgram, gl.LINK_STATUS);
    if (!success) {
        console.log("ERROR:: SHADER:: PROGRAM:: LINKING_FAILED\n" +
            gl.getProgramInfoLog(shaderProgram));
        return;
    }
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    let vertices = new Float32Array([
        0.5, -0.5, 0.0,
        -0.5, -0.5, 0.0,
        0.0, 0.5, 0.0
    ]);
    VAO = gl.createVertexArray();
    let VBO = gl.createBuffer();
    gl.bindVertexArray(VAO);
    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 3 * sizeFloat, 0);
    gl.enableVertexAttribArray(0);
    gl.bindVertexArray(VAO);
    requestAnimationFrame(render);
}();
function render() {
    processInput();
    gl.clearColor(0.2, 0.3, 0.3, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(shaderProgram);
    let timeValue = performance.now() / 1000;
    let greenValue = Math.sin(timeValue) / 2.0 + 0.5;
    let vertexColorLocation = gl.getUniformLocation(shaderProgram, "ourColor");
    gl.uniform4f(vertexColorLocation, 0.0, greenValue, 0.0, 1.0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    requestAnimationFrame(render);
}
function processInput() {
}
function framebufferSizeCallback(width, height) {
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    requestAnimationFrame(render);
}
//# sourceMappingURL=shaders_uniform.js.map