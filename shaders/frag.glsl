#version 300 es

precision mediump float;

uniform vec2 u_resolution;
uniform sampler2D u_colorTexture;

uniform vec3 u_cameraPosition;
uniform float u_shininess;

uniform vec3 u_dlight_color;
uniform vec3 u_dlight_direction;
uniform vec3 u_dlight_power;


in vec2 v_colorCoord;
in vec3 v_normal;
in vec3 v_fragPos;

out vec4 FragColor;


vec3 calculateDirectional(vec3 materialColor, vec3 normal){
	vec3 ambient = u_dlight_color * u_dlight_power.x;		//	Calculate ambient lighting

	vec3 lightDir = normalize(u_dlight_direction);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * u_dlight_color * u_dlight_power.y;

	vec3 viewDirection = normalize(u_cameraPosition - v_fragPos);				//	Calculate specular lighting
	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = u_dlight_power.z * spec * u_dlight_color;

	return (ambient + diffuse + specular) * materialColor;
}
/*
vec3 calculateDirectional(vec3 materialColor, vec3 normal){
	vec3 ambient = u_dlight_color * u_dlight_power.x;		//	Calculate ambient lighting

	vec3 lightDir = normalize(u_lightPosition - v_fragPos);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * u_lightColor;

	vec3 viewDirection = normalize(u_cameraPosition - v_fragPos);				//	Calculate specular lighting
	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = u_specularStrength * spec * u_lightColor;

	return (ambient + diffuse + specular) * materialColor;
}
//*/

void main() {
	//vec2 uv = gl_FragCoord;
	vec3 materialColor = texture(u_colorTexture, v_colorCoord).xyz;
	vec3 normal = normalize(v_normal);


// +specular
	vec3 result = calculateDirectional(materialColor, normal);				//	Combine the lights and the material color to get the final color of this pixel
	FragColor =  vec4(result, 1.0);
}