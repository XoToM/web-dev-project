let _globalScene = new Object3();

function performRender(cameraMatrix){
	let materialMap = new Map();
	function calculateTransforms(object3, parentMatrix){
		let matrix = object3.calculateMatrix(parentMatrix);
		if(object3 instanceof Mesh3d){
			for(let primitive of object3._primitives){
				let list = materialMap.get(primitive.material);
				if(list === undefined){
					list = [];
					materialMap.set(primitive.material, list);
				}
				list.push([matrix, primitive, shader]);				
			}
		}
		if(object3 instanceof Object3){
			for(let child of object3.children) {
				calculateTransforms(child, matrix);
			}
		}
	}
	calculateTransforms(_globalScene, cameraMatrix);

	let boundShader = null;
	for(let [material, primitiveList, shader] of materialMap.entries()){
		//	Bind all textures of material here
		if(boundShader !== shader){
			boundShader = shader;
			gl.useProgram(shader.program);
		}

		for(let [matrix, primitive] of primitiveList){
			let renderUniforms = {
				u_worldTransformMatrix: matrix
			};
			
			twgl.setUniforms(shader, renderUniforms);

			//call draw functions
		}
	}
}