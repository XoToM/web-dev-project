#version 300 es

precision mediump float;

uniform vec2 resolution;
uniform sampler2D u_colorTexture;

uniform vec4 u_ambientLight;
uniform vec3 u_lightPosition;
uniform vec3 u_lightColor;
uniform vec3 u_cameraPosition;
uniform float u_specularStrength;
uniform float u_shininess;
uniform int u_renderSettings;

in vec2 v_colorCoord;
in vec3 v_normal;
in vec3 v_fragPos;
out vec4 FragColor;


void main() {
	//vec2 uv = gl_FragCoord;
	//vec3 materialColor = texture(u_colorTexture, v_colorCoord).xyz;
	vec3 materialColor = texture(u_colorTexture, vec2(mod(v_fragPos.x, 1.0),mod(v_fragPos.z, 1.0))).xyz;
	//v_fragPos
	vec3 normal = normalize(v_normal);

	vec3 ambient = u_ambientLight.xyz * u_ambientLight.w;		//	Calculate ambient lighting

	vec3 lightDir = normalize(u_lightPosition - v_fragPos);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * u_lightColor;

	vec3 viewDirection = normalize(u_cameraPosition - v_fragPos);				//	Calculate specular lighting
	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = u_specularStrength * spec * u_lightColor;

	if(bool(u_renderSettings & 1)) {
		ambient = vec3(0);
	}
	if(bool(u_renderSettings & 2)) {
		diffuse = vec3(0);
	}
	if(bool(u_renderSettings & 4)) {
		specular = vec3(0);
	}
	if((u_renderSettings & 7) == 7) {
		ambient = vec3(1);
	}

// +specular
	vec3 result = (ambient + diffuse + specular) * materialColor;				//	Combine the lights and the material color to get the final color of this pixel
	FragColor =  vec4(result, 1.0);
}