let _globalScene = new Object3();
const MAX_POINT_LIGHTS = 16;

function performRender(cameraMatrix,cameraPos, standardUniforms){
	if(document.hidden) return;
	let materialMap = new Map();
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	cameraPos[2] *= -1;

	let animators = [];

	function calculateTransforms(object3, parentMatrix){
		if(object3 instanceof Object3){
			if(!object3.renderVisibility) return;
			if(object3.animationPlayer) animators.push(object3.animationPlayer);

			let adjust;
			for(let animator of animators){
				adjust = animator.calculateAdjust(object3, adjust);
			}

			let matrix = object3.calculateMatrix(parentMatrix, adjust);

			if(object3 instanceof Mesh3d){
				for(let primitive of object3._mesh._primitives){
					let res = materialMap.get(primitive.material);

					if(res === undefined){
						res = [[], primitive.mesh._asset.shader];
						materialMap.set(primitive.material, [res[0], res[1]]);
					}
					let [list, shader] = res;
					let normalMatrix = m4.inverse(matrix);
					m4.transpose(normalMatrix, normalMatrix);
					list.push([matrix, primitive, normalMatrix]);
				}
			}
			for(let child of object3.children) {
				calculateTransforms(child, matrix);
			}
			if(object3.animationPlayer) animators.pop();
		}
	}
	calculateTransforms(_globalScene, m4.identity());

	let pointLights = [...__LightManager.point];
	pointLights.sort((a,b)=>(v3.distanceSq(a.position, v3.copy(cameraPos)) - v3.distanceSq(b.position, v3.copy(cameraPos))));	//	Optimisation based on the assumption that if the camera is far enough the detail wont matter as much. This will often be completely invisible if the world is split into rooms, with only a couple lights in each room
	let pointLights_ready = [];
	for(let i=0; i<Math.min(pointLights.length, MAX_POINT_LIGHTS); i++){
		let pl = pointLights[i];
		if(pl.renderVisibility) pointLights_ready.push(pl.generateData());
	}

	let lightUniforms = {
		u_dlight_color: __LightManager.directional.lightColor,
		u_dlight_direction: __LightManager.directional.direction,
		u_dlight_power: __LightManager.directional.power,
		u_pointLights: pointLights_ready,
		u_pointLightCount: pointLights_ready.length
	};



	let boundShader = null;
	for(let [material, [primitiveList,shader]] of materialMap.entries()){
		//	Bind all textures of material here
		if(boundShader !== shader){
			boundShader = shader;
			gl.useProgram(shader.program);

			twgl.setUniforms(shader, standardUniforms);
			twgl.setUniforms(shader, lightUniforms);
		}

		for(let [texName, texInfo] of Object.entries(material.textures)){
			gl.activeTexture(gl.TEXTURE0 + texInfo.unit);
			gl.bindTexture(gl.TEXTURE_2D, texInfo.texture);
			gl.bindSampler(texInfo.unit, texInfo.sampler);
			gl.uniform1i(texInfo.samplerUniform, texInfo.unit);
		}

		twgl.setUniforms(shader, material.uniforms);
		if(material.doubleSided){
			gl.disable(gl.CULL_FACE);
		}else{
			gl.enable(gl.CULL_FACE);
		}

		for(let [matrix, primitive, normalMatrix] of primitiveList){

			let renderUniforms = {
				u_modelMatrix: matrix,
				u_viewMatrix: cameraMatrix,
				u_normalMatrix: normalMatrix
			};

			twgl.setUniforms(shader, renderUniforms);



			//call draw functions
			gl.bindVertexArray(primitive.vao);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, primitive.mesh._asset.ebo);

			if(primitive.indices){
				gl.drawElements(primitive.primitiveType, primitive.count, primitive.indices.type, primitive.indices.offset)
			}else{
				//gl.drawArrays(primitive.primitiveType, primitive.offset, primitive.count);
			}
		}
	}
}