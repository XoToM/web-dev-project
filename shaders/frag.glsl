#version 300 es

precision mediump float;
precision mediump usampler3D;

uniform vec2 resolution;
uniform float time;
uniform usampler3D voxel_map;

out vec4 FragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;

	vec2 pos = uv * 8.0 * 16.0;
	
	if((int(pos.x) == 0 || int(pos.y)==0) && int(pos.x)!=int(pos.y) ){
	//	FragColor = vec4(1.0, 0.6+0.25 * cos(time), 0.5, 1.0);
	//	return;
	}
	if(int(pos.x)== 10 && int(pos.y)==10){
		ivec3 size = textureSize(voxel_map, 0);
		FragColor = vec4(float(size.x),float(size.y),float(size.z), 1.0);
		//return;
	}
	//pos.x += 8.0*0.0;

	uvec4 data = texelFetch(voxel_map, ivec3(int(pos.x), int(pos.y), 4),0);

	if(data.w == 2u){
		FragColor = vec4(0.0,0.0,1.0,1.0);
		return;
	}

	if((data.x | data.y | data.z) != 0u){
		FragColor = vec4(float(data.x)/256.0,float(data.y)/256.0,float(data.z)/256.0, 1.0);
		//FragColor = vec4(data.xyz,1.0);//(vec3(0.5), 1.0);
		return;
	}

	if(data.w != 0u){
		FragColor = vec4(0.0,0.0,1.0, 1.0);
		return;
	}

	if(data.w != 0u){
		if(data.w == 1u){
			FragColor = vec4(0.0, 1.0,0.0, 1.0);
		}else{
			if(data.w == 2u){
				FragColor = vec4(0.0,0.0,1.0, 1.0);
			}else{
				if(data.w < 255u){
					FragColor = vec4(1.0,0.5,1.0, 1.0);
				}else{
					FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				}
				//FragColor = vec4(1.0, 0.0, 0.0, 1.0);
			}
		}
		return;
	}
	
	FragColor = vec4(vec3(0.0), 1.0);
}