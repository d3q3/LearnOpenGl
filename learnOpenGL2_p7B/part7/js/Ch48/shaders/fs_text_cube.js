export let fs_text_cube = `#version 300 es 
precision mediump float;
out vec4 FragColor;

struct Material {
    sampler2D diffuse;
}; 

struct Light {
    vec3 position;
    vec3 diffuse;
};

in vec3 FragPos;  
in vec3 Normal;  
in vec2 TexCoords;
  
uniform vec3 viewPos;
uniform Material material;
uniform Light light;

void main()
{  	
    // diffuse 
    vec3 norm = normalize(Normal);
    vec3 lightDir = normalize(light.position - FragPos);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = light.diffuse * diff * texture(material.diffuse, TexCoords).rgb;  
            
    FragColor = vec4(diffuse, 1.0);
} `