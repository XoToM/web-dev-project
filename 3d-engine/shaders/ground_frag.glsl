#version 300 es

precision mediump float;


#define MAX_POINT_LIGHTS 16


struct PointLight {
	vec3 position;
	vec3 lightColor;
	vec3 lightPowers;
	vec3 attenuation;	//	x:constant, y:linear, z:quadratic
};


uniform vec2 u_resolution;
uniform sampler2D u_colorTexture;

uniform vec3 u_cameraPosition;
uniform float u_shininess;

uniform vec3 u_dlight_color;
uniform vec3 u_dlight_direction;
uniform vec3 u_dlight_power;

uniform PointLight u_pointLights[MAX_POINT_LIGHTS];
uniform int u_pointLightCount;


in vec2 v_colorCoord;
in vec3 v_normal;
in vec3 v_fragPos;

out vec4 FragColor;


vec3 calculateDirectional(vec3 normal, vec3 viewDirection){
	vec3 ambient = u_dlight_color * u_dlight_power.x;		//	Calculate ambient lighting

	vec3 lightDir = normalize(u_dlight_direction);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * u_dlight_color * u_dlight_power.y;

	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = u_dlight_power.z * spec * u_dlight_color;

	return (ambient + diffuse + specular) ;
}

vec3 calculatePoint(PointLight light, vec3 normal, vec3 viewDirection){
	float dist = length(light.position - v_fragPos);
	float attenuation = 1.0 / (light.attenuation[0] + light.attenuation[1] * dist + light.attenuation[2] * (dist * dist));

	vec3 ambient = light.lightColor.xyz * light.lightPowers.x;		//	Calculate ambient lighting

	vec3 lightDir = normalize(light.position.xyz - v_fragPos);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * light.lightColor.xyz * light.lightPowers.y;

	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = light.lightPowers.z * spec * light.lightColor.xyz;

	ambient *= attenuation;
	diffuse *= attenuation;
	specular *= attenuation;

	return (ambient + diffuse + specular);
}
//*/

void main() {
	//vec2 uv = gl_FragCoord;
	vec3 materialColor = texture(u_colorTexture, vec2(mod(v_fragPos.x, 1.0),mod(v_fragPos.z, 1.0))).xyz;	//	Looping texture for the ground plane
	//vec3 materialColor = texture(u_colorTexture, v_colorCoord).xyz;
	vec3 normal = normalize(v_normal);
	vec3 viewDirection = normalize(u_cameraPosition - v_fragPos);				//	Calculate specular lighting

																					//	Combine the lights and the material color to get the final color of this pixel
	vec3 result = calculateDirectional(normal, viewDirection) * materialColor;
	//vec3 result = vec3(0.0);

	for(int i=0; i<min(u_pointLightCount, MAX_POINT_LIGHTS); i++){
		result += calculatePoint(u_pointLights[i], normal, viewDirection) * materialColor;
	}

	FragColor =  vec4(result, 1.0);
}