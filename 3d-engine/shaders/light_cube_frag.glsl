#version 300 es

precision mediump float;


#define MAX_POINT_LIGHTS 8


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


void main() {
	FragColor =  vec4(1.0);
}