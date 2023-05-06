let _globalScene = new Object3();

function performRender(cameraMatrix, standardUniforms){
	let materialMap = new Map();
	gl.clearColor(0,0,0,1);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	function calculateTransforms(object3, parentMatrix){
		if(object3 instanceof Object3){
			if(!object3.renderVisibility) return;
			let matrix = object3.calculateMatrix(parentMatrix);
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
		}
	}
	calculateTransforms(_globalScene, m4.identity());


	let boundShader = null;
	for(let [material, [primitiveList,shader]] of materialMap.entries()){
		//	Bind all textures of material here
		if(boundShader !== shader){
			boundShader = shader;
			gl.useProgram(shader.program);

			twgl.setUniforms(shader, standardUniforms);
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