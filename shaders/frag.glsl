#version 300 es

precision mediump float;


#define MAX_POINT_LIGHTS 8


struct PointLight {
	vec4 position;
	vec4 lightColor;
	vec4 lightPowers;
	vec4 attenuation;	//	x:constant, y:linear, z:quadratic
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
	vec3 ambient = light.lightColor.xyz * light.lightPowers.x;		//	Calculate ambient lighting

	vec3 lightDir = normalize(light.position.xyz - v_fragPos);								//	Calculate diffuse lighting
	float diffuseDifference = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = diffuseDifference * light.lightColor.xyz * light.lightPowers.y;

	vec3 reflectDirection = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDirection, reflectDirection), 0.0), u_shininess);
	vec3 specular = light.lightPowers.z * spec * light.lightColor.xyz;

	return (ambient + diffuse + specular);
}
//*/

void main() {
	//vec2 uv = gl_FragCoord;
	vec3 materialColor = texture(u_colorTexture, v_colorCoord).xyz;
	vec3 normal = normalize(v_normal);
	vec3 viewDirection = normalize(u_cameraPosition - v_fragPos);				//	Calculate specular lighting


	vec3 result = calculateDirectional(normal, viewDirection) * materialColor;				//	Combine the lights and the material color to get the final color of this pixel

	FragColor =  vec4(result, 1.0);
}