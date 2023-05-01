#version 300 es

precision mediump float;

uniform vec2 resolution;

out vec4 FragColor;


void main() {
	//vec2 uv = gl_FragCoord;

	FragColor = vec4(vec3(gl_FragCoord.z), 1.0);
}