export var vs_brdf =
`#version 300 es
precision mediump float;

layout (location = 0) in vec3 aPos;
//D3Q: location 1 introduced because of code in renderQuad()
layout (location = 1) in vec3 aColor;
layout (location = 2) in vec2 aTexCoords;

out vec2 TexCoords;

void main()
{
    TexCoords = aTexCoords;
	gl_Position = vec4(aPos, 1.0);
}`