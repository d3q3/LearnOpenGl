export var fs_equirectangularToCubemap =
`#version 300 es
precision mediump float;

out vec4 FragColor;
//out uvec4 uFragColor;

in vec3 WorldPos;

uniform sampler2D equirectangularMap;

//conversion from (-pi, pi)=>(-1/2, 1/2) and (-pi/2, pi/2)=>(-1/2, 1/2) 
const vec2 invAtan = vec2(0.1591, 0.3183);

vec2 SampleSphericalMap(vec3 v)
{
    vec2 uv = vec2(atan(v.z, v.x), asin(v.y));
    uv *= invAtan;
    uv += 0.5;
    return uv;
}

void main()
{		
    vec2 uv = SampleSphericalMap(normalize(WorldPos));
    vec3 color = texture(equirectangularMap, uv).rgb;
    
    FragColor = vec4(color, 1.0);
    //uFragColor = uvec4(100, 0, 0, 1);
}`
