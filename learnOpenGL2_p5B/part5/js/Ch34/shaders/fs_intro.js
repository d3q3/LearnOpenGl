export var fs_intro = 
`#version 300 es
precision mediump float;

out vec4 FragColor;

in    vec3 FragPos;
in    vec3 Normal;
in    vec2 TexCoords;

uniform sampler2D floorTexture;

uniform vec3 viewPos;
uniform int gamma; //options 1, 2, 3, 4


void main()
{           
    vec3 color = texture(floorTexture, TexCoords).rgb;
    if(gamma==2 || gamma==4)
        color = pow(abs(color), vec3(1.0/2.2));

    FragColor = vec4(color, 1.0);
}`