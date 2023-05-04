#version 300 es

precision mediump float;

uniform vec2 resolution;
uniform sampler2D u_colorTexture;

in vec2 v_colorCoord;
out vec4 FragColor;


void main() {
	//vec2 uv = gl_FragCoord;
	vec4 color = texture(u_colorTexture, v_colorCoord);
	FragColor = vec4(color.xyz,1.0);
	//FragColor = vec4(vec3(1.0-(gl_FragCoord.z/1.5)), 1.0);
}