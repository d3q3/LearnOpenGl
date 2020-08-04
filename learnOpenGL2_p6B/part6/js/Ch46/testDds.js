import { mat4 } from '../../../math/glmatrix/index.js';
import { Shader } from '../../js/common/Shader.js';
import { loadDDSTexture } from './readDds.js';
let canvas = document.createElement('canvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl2', { antialias: true });
if (!gl) {
    console.log("WebGL 2 needed");
}
const ext = gl.getExtension("EXT_color_buffer_float");
if (!ext) {
    console.log("EXT_color_buffer_float needed");
}
"use strict";
var textureSet = [
    { src: "../../textures/dds/test-dxt1.dds", label: "DDS (DXT1)" },
    { src: "../../textures/dds/test-dxt5.dds", label: "DDS (DXT5)" },
];
var rows = 3;
var cols = 3;
let main = function () {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    gl.viewport(0, 0, canvas.width, canvas.height);
    var cubeVS = [
        "attribute vec3 position;",
        "attribute vec2 texture;",
        "uniform mat4 viewMat;",
        "uniform mat4 projMat;",
        "varying vec2 texCoord;",
        "void main(void) {",
        "   texCoord = texture;",
        "   gl_Position = projMat * viewMat * vec4(position, 1.0);",
        "}"
    ].join("\n");
    var cubeFS = [
        "precision highp float;",
        "uniform sampler2D diffuse;",
        "varying vec2 texCoord;",
        "void main(void) {",
        "   gl_FragColor = texture2D(diffuse, texCoord);",
        "}"
    ].join("\n");
    var shader = new Shader(gl, cubeVS, cubeFS);
    gl.useProgram(shader.programId);
    var quadVerts = [
        0, -1, 0, 0, 1,
        1, -1, 0, 1, 1,
        0, 0, 0, 0, 0,
        1, 0, 0, 1, 0
    ];
    var quadIndices = [
        0, 1, 2,
        2, 1, 3
    ];
    var vertBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVerts), gl.STATIC_DRAW);
    let attrPos = gl.getAttribLocation(shader.programId, "position");
    gl.enableVertexAttribArray(attrPos);
    gl.vertexAttribPointer(attrPos, 3, gl.FLOAT, false, 20, 0);
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(quadIndices), gl.STATIC_DRAW);
    let attrTex = gl.getAttribLocation(shader.programId, "texture");
    gl.enableVertexAttribArray(attrTex);
    gl.vertexAttribPointer(attrTex, 2, gl.FLOAT, false, 20, 12);
    gl.activeTexture(gl.TEXTURE0);
    shader.setInt(gl, "diffuse", 0);
    let extS3tc = gl.getExtension("WEBGL_compressed_texture_s3tc");
    var textures = [];
    var i, l;
    for (i = 0, l = textureSet.length; i < l; ++i) {
        textures.push(loadDDSTexture(gl, extS3tc, textureSet[i].src, function (texture, width, height, mipmaps) {
            console.log("Texture Size:", width, height);
            console.log("Texture mipmap count", mipmaps);
        }));
    }
    var viewMat = mat4.create();
    var projMat = mat4.create();
    mat4.ortho(projMat, 0, cols, -rows, 0, 0, 1);
    gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "projMat"), false, projMat);
    setInterval(function () {
        var i, l;
        mat4.identity(viewMat);
        for (i = 0, l = textures.length; i < l; ++i) {
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.uniformMatrix4fv(gl.getUniformLocation(shader.programId, "viewMat"), false, viewMat);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
            mat4.translate(viewMat, viewMat, [1, 0, 0]);
            if ((i + 1) % cols == 0) {
                mat4.translate(viewMat, viewMat, [-cols, -1, 0]);
            }
        }
    }, 1000);
}();
//# sourceMappingURL=testDds.js.map