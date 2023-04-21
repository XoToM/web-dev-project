#version 300 es

precision mediump float;
precision mediump isampler3D;

uniform vec2 resolution;
uniform float time;
uniform isampler3D voxel_map;

out vec4 FragColor;

void main() {
	vec2 uv = gl_FragCoord.xy / resolution;
	float color = 0.0;
	// lifted from glslsandbox.com
	color += sin( uv.x * cos( time / 3.0 ) * 60.0 ) + cos( uv.y * cos( time / 2.80 ) * 10.0 );
	color += sin( uv.y * sin( time / 2.0 ) * 40.0 ) + cos( uv.x * sin( time / 1.70 ) * 40.0 );
	color += sin( uv.x * sin( time / 1.0 ) * 10.0 ) + sin( uv.y * sin( time / 3.50 ) * 80.0 );
	color *= sin( time / 10.0 ) * 0.5;

	vec2 pos = uv * 8.0 * 16.0;
	//pos.x += 8.0*0.0;

	ivec4 data = texelFetch(voxel_map, ivec3(int(pos.x), int(pos.y), 0),0);

	if(data.w != 0){
		if(data.w == 1){
			FragColor = vec4(0.0, 1.0,0.0, 1.0);
		}else{
			if(data.w == 2){
				FragColor = vec4(0.0,0.0,1.0, 1.0);
			}else{
				if(data.w < 255){
					FragColor = vec4(0.0,0.0,1.0, 1.0);
				}else{
					FragColor = vec4(1.0, 0.0, 0.0, 1.0);
				}
				//FragColor = vec4(1.0, 0.0, 0.0, 1.0);
			}
		}
		
		
		return;
	}
	if((data.x | data.y | data.z) != 0){
		FragColor = vec4(vec3(0.5), 1.0);
		return;
	}
	//if(uv)
	FragColor = vec4(vec3(0.0), 1.0);
	//FragColor = vec4( vec3( color * 0.5, sin( color + time / 2.5 ) * 0.75, color ), 1.0 );
}