#version 300 es

precision mediump float;
precision mediump usampler3D;

uniform vec2 resolution;
uniform float time;
uniform usampler3D voxel_map;
uniform int slice_step;

out vec4 FragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	vec2 pos = uv * 8.0 * 32.0;
	pos.y = pos.y*1.5;


	uvec4 data = texelFetch(voxel_map, ivec3(int(pos.x), int(pos.y), slice_step),0);

	if(data.w == 2u){
		FragColor = vec4(0.0,0.0,1.0,1.0);
		return;
	}
	if(data.w == 1u){
		FragColor = vec4(float(data.x)/256.0,float(data.y)/256.0,float(data.z)/256.0, 1.0);
		return;
	}
	if(data.w != 0u){
		FragColor = vec4(1.0,0.0,0.0,1.0);
		return;
	}

	FragColor = vec4(vec3(0.0), 1.0);
}