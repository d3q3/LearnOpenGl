export var fs_cubeface =
`#version 300 es
precision mediump float;

out vec4 FragColor;
in vec3 WorldPos;

uniform samplerCube environmentMap;
uniform bool showIntensity;
uniform int id;

void main()
{		
    // I will use the openGL id's for the different sides of the cube
    // Lefthanded, positive Z is backside cube!
    // 0	GL_TEXTURE_CUBE_MAP_POSITIVE_X =right
    // 1	GL_TEXTURE_CUBE_MAP_NEGATIVE_X =left
    // 2	GL_TEXTURE_CUBE_MAP_POSITIVE_Y =top
    // 3	GL_TEXTURE_CUBE_MAP_NEGATIVE_Y =bottom
    // 4	GL_TEXTURE_CUBE_MAP_POSITIVE_Z =back!
    // 5	GL_TEXTURE_CUBE_MAP_NEGATIVE_Z =front!
    // if (showLeftRight) [1, 5, 0, 4] else [2, 4, 3]
    vec3 cubePos = WorldPos; //if id = 5 (front, negatiev_z) no changes.
    if (id==1) {cubePos.x = -WorldPos.z; cubePos.z = WorldPos.x; } //left
    if (id==4) {cubePos.x = -WorldPos.x; cubePos.z =-WorldPos.z;} //back
    if (id==0) {cubePos.x =  WorldPos.z; cubePos.z =-WorldPos.x;} //right
    if (id==5) {cubePos.x =  WorldPos.x; cubePos.z =WorldPos.z;} //front
    if (id==2) {cubePos.z = WorldPos.y;  cubePos.y=WorldPos.z;}  //bottom
    if (id==3) {cubePos.z = -WorldPos.y; cubePos.y=-WorldPos.z;} //top

    vec3 envColor = texture(environmentMap, cubePos).rgb;

    if (showIntensity) {
        if (envColor.r>1.0 || envColor.g>1.0 || envColor.b>1.0) {
            FragColor = vec4(1.0, 0.0, 0.0, 1.0);
        }
        else {
            FragColor = vec4(0.0, 0.0, 1.0, 1.0);
        }
        return;
    }

    // HDR tonemap and gamma correct
    envColor = envColor / (envColor + vec3(1.0));
    envColor = pow(envColor, vec3(1.0/2.2)); 
    
    FragColor = vec4(envColor, 1.0);
}`
