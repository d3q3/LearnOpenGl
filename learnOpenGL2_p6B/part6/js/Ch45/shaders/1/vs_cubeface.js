export var vs_cubeface =
`#version 300 es
precision mediump float;

layout (location = 0) in vec3 aPos;

//uniform mat4 projection;
//uniform mat4 view;
uniform float index;
uniform float aspectRatio;


out vec3 WorldPos;

void main()
{
	WorldPos = aPos;
	float f = 0.24;
	vec3 clipPos = f*WorldPos;
	clipPos.x=-(-1.0+f+clipPos.x+index*(2.0*f+0.01));
	clipPos.y=clipPos.y*aspectRatio;
	gl_Position = vec4(clipPos, 1.0);
}`