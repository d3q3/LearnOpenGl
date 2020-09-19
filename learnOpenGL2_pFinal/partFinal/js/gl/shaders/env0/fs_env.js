export var fs_env =
`#version 300 es
precision mediump float;

out vec4 FragColor;

in vec3 TexCoords;

uniform samplerCube cubemap;

void main()
{    
    FragColor = texture(cubemap, TexCoords);
}
`