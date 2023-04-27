let _assetManager = null;
let _gl = null;

class AssetManager{
	gl = null;
	modelMap = new Map();

	constructor(gl){
		this.gl = gl;
		_gl = gl;
		_assetManager = this;
	}

	loadModel(path, id){
		if(this.modelMap.has(id)) {
			let e = async()=>this.modelMap.get(id);
			return e();
		}
		let asset = new ModelAsset(this);

		asset.path = path;
		asset.loader = fetch(path).then(async (gltf)=>{
			let gl = this.gl;
			gltf = await gltf.json();
			let toLoad = [];

			let buffers = gltf.buffers;
			let views = gltf.bufferViews;

			for(let mesh of gltf.meshes){
				for(let primitive of mesh.primitives){

				}
				toLoad.push();//
			}


			asset.defaultScene = asset.scenes[gltf.scene];

			await Promise.all(toLoad);
			asset.ready = true;
		});

		this.modelMap.set(id, asset);

		return asset.loader.then(()=>asset);
	}
}
class ModelAsset {
	manager = null;
	loader = null;
	path = null;
	ready = false;

	scenes = [];
	defaultScene = null;
	nodes = [];
	meshes = [];
	accessors = [];
	buffers = [];
	attributeParamaters = new Map();
	constructor(manager){
		this.manager = manager;
	}
	initSceneWithProgram(scene, program){
		let gl = this.manager.gl;
		scene = structuredClone(scene);

		for(let [aname, aprop] of this.attributeParamaters){						//	ToDo: Finish loading models into gpu
			let location = gl.getAttribLocation(program, aname);
			gl.vertexAttribPointer(location, size, type, normalized, stride, offset);
		}

		return scene;
	}
}
class Node3D {
	name = null;
	translation = [0, 0, 0];
	rotation = [0, 0, 0, 1];
	scale = [1, 1, 1];
	mesh = null;
	children = [];

	calculateTransform(){
		let tran = m4.translation(this.translation);
		let rotx = m4.rotationX(this.rotation[0]);
		let roty = m4.rotationY(this.rotation[1]);
		let rotz = m4.rotationZ(this.rotation[2]);
		let rot = m4.multiply(rotx, m4.multiply(roty, rotz));
		let scal = m4.scaling(this.scale);
		return m4.mutliply(tran, m4.multiply(rot, scal));
	}
	render(){
		
	}
}
class Mesh3d {
	primitives = [];
	weights = null;
}
class Mesh3dPrimitive {
	primitiveType = 4;	//	Describes the type of primitive to render (default 4 for gl.TRIANGLES)
	attributes = new Map();
	indices = null;
	material = null;
	morphTargets = null;

	render(){

	}
}
/*class AssetAccessor {
	bufferView = null;
	offset = 0;
	componentType = 0;
	normalized = false;
	elementCount = 0;
	size = 0;
	//max = [];	//	Not needed?
	//min = [];	//	Not needed?
	//sparse = null;	//	Not supported yet
}//*/
class AssetBufferView{
	buffer = null;
	offset = 0;
	length = 0;
	stride = 0;
	target = 0;
	constructor(target){
		this.target = target || _gl.ARRAY_BUFFER;
	}
}