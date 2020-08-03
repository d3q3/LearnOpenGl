export var fs_lighting =
`#version 300 es
precision mediump float;

out vec4 FragColor;

in vec3 FragPos;
in vec3 Normal;
in vec2 TexCoords;


// struct Light {
//     vec3 Position;
//     vec3 Color;
// };

uniform vec3 lightPositions[4];
uniform vec3 lightColors[4];

//uniform Light lights[16];
uniform sampler2D diffuseTexture;
uniform vec3 viewPos;

void main()
{           
    vec3 color = texture(diffuseTexture, TexCoords).rgb;
    vec3 normal = normalize(Normal);
    // ambient
    vec3 ambient = 0.0 * color;
    // lighting
    vec3 lighting = vec3(0.0);
    for(int i = 0; i < 4; i++)
    {
        // diffuse
        vec3 lightDir = normalize(lightPositions[i] - FragPos);
        float diff = max(dot(lightDir, normal), 0.0);
        vec3 diffuse = lightColors[i] * diff * color;      
        vec3 result = diffuse;        
        // attenuation (use quadratic as we have gamma correction)
        float distance = length(FragPos - lightPositions[i]);
        result *= 1.0 / (distance * distance);
        lighting += result;
                
    }
    FragColor = vec4(ambient + lighting, 1.0);
}`