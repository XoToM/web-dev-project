const WEBGL_DATATYPE_SIZES = {
	0x1400:1,
	0x1401:1,
	0x1402:2,
	0x1403:2,
	0x1404:4,
	0x1405:4,
	0x1406:4,
	"SCALAR":1,
	"VEC2":2,
	"VEC3":3,
	"VEC4":4,
	"MAT2":4,
	"MAT3":9,
	"MAT4":16
}
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

			let bufferViews = [];

			for(let accessor of gltf.accessors){
				let view = gltf.bufferViews[accessor.bufferView];
				let dataBuffer = gltf.buffers[view.buffer];

				if(!dataBuffer.dataReady){
					dataBuffer.dataReady = async()=>(await (await fetch(dataBuffer.uri)).blob());
				}
				let dataSize = WEBGL_DATATYPE_SIZES[accessor.type] * WEBGL_DATATYPE_SIZES[accessor.componentType];
				accessor.dataSize = dataSize;
				let bufferOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
				let stride = view.byteStride || dataSize;

				accessor.dataReady = dataBuffer.dataReady.then(async(data)=>{
					accessor.data = data;

					function* getReader(max){
						let offset = bufferOffset;
						let count = accessor.count;
						if(max) count = Math.min(count, max);

						for(let i=0;i<count;i++){
							let result = new Uint8Array(dataSize);
							for(let o=0;o<dataSize;o++){
								result[o] = data[offset+o];
							}
							yield result;
							offset += stride;
						}
					}
					accessor.getReader = getReader;
				});
				accessor.totalBytes = dataSize*accessor.count;
				toLoad.push(accessor.dataReady);
			}

			await Promise.all(toLoad);
			toLoad = [];
			for(let mesh of gltf.meshes){
				let attribSize = 0;
				let elementSize = 0;
				for(let primitive of mesh.primitives){
					primitive.finalCount = Infinity;
					primitive.attribStride = 0;
					for(let accessor of primitive.attributes) {
						attribSize += accessor.totalBytes;				//	Count the total size of the VBO
						primitive.attribStride += accessor.dataSize;	//	Calculate the stride for this primitive's attributes
						if(primitive.finalCount > accessor.count) primitive.finalCount = accessor.count;	//	Calculate the amount of verticies stored
					}
					if(primitive.indices) elementSize += gltf.accessors[primitive.indices].dataSize;	//	Calculate the size of the EBO
				}

				let attributeBuffer = new Uint8Array(attribSize);
				let elementBuffer = new Uint8Array(elementSize);
				let attribPointer = 0;
				let elemPointer = 0;

				for(let primitive of mesh.primitives){
					
																			//		WARNING!		Apparently vertexAttribPointer requires its offsets to be in multiples of (size of attribute data per vertex) bytes, and its stride cannot be bigger than 255
																			//		TODO:			Sort attributes in terms of size per vertex (largest first) to make sure each attribute is aligned properly
																			//		TODO:			Redo attribute stride calculations
																			//		TODO:			Make sure the offset of each primitive in the VBO is aligned to 16 bytes (to make sure every primitive's base pointer is always aligned properly)
																			//		TODO:			Redo VBO size calculation

					if(primitive.indices){					//	Set up the EBO for this primitive
						let indices = gltf.accessors[primitive.indices];
						primitive.indicesInfo = { offset:elemPointer, type: indices.componentType, count: indices.count};
						let indgen = indices.getReader(indices.count);
						for(let bytes of indgen){
							for(let i=0; i<bytes.length; i++){
								elementBuffer[elemPointer++] = bytes[i];
							}
						}
					}

					primitive.attribInfo = {};
					let attribOffset = 0;
					for(let [accessorName, accessor] of Object.entries(primitive.attributes)){
						let generator = accessor.getReader(primitive.finalCount);
						let pointer = elemPointer + attribOffset;

						primitive.attribInfo[accessorName] = {offset:pointer, componentType:accessor.componentType, attribSize:WEBGL_DATATYPE_SIZES[accessor.type], normalized:(accessor.normalized || false), }

						for(let bytes of generator){
							for(let i=0; i<bytes.length; i++){
								elementBuffer[pointer+i] = bytes[i];
							}
							pointer += primitive.attribStride;
						}
						attribOffset += accessor.dataSize;
					}
					elemPointer += primitive.attribStride * primitive.finalCount;
				}
			}



			for(let node of gltf.nodes){
				let n = new Node3D();
				n.translation = node.translation || n.translation;
				n.rotation = node.rotation || n.rotation;
				n.scale = node.scale || n.scale;
				n.name = node.name;

				n.children = node.children || [];
				if(typeof(node.mesh) == "number") n.mesh = asset.meshes[node.mesh];
				asset.nodes.push(n);
				//	Load all nodes. Load each node through iterration, then fill in references to their children afterwards to make sure each node is only loaded once, and they are in the correct order.
				//	Node transforms are not global transformations, meaning that each node is affected by their parent's transformation. They appear to get applied just before a node is rendered
			}
			for(let node of asset.nodes){
				node.children = node.children.map((index)=>asset.nodes[index]);
			}


			for(let scene of gltf.scenes){
				let s = new Node3D();
				s.name = scene.name;
				s.children = scene.nodes.map((index)=>asset.nodes[index]);
				asset.scenes.push(s);
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