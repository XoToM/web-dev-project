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
		let asset = new ModelAsset(manager);

		asset.path = path;
		asset.loader = fetch(path).then(async (gltf)=>{
			let gl = this.gl;
			gltf = await gltf.json();
			let toLoad = [];


			for(let bufferView of gltf.bufferViews){
				let buf = gltf.buffers[bufferView.buffer];
				if(bufferView.target) buf.target = bufferView.target;

				let bv = new AssetBufferView(bufferView.target);
				bv.offset = bufferView.byteOffset;
				bv.length = bufferView.byteLength;
				bv.stride = bufferView.byteStride;
				
				if(!buf.onLoad){
					buf.onLoad = new Promise((resolve, _)=>{buf.resolve = resolve});
				}
				buf.onLoad = buf.onLoad.then((b)=>{ bv.buffer = b; return b; });
			}
			
			for(let buffer of gltf.buffers){
				if(!buffer.target) continue;

				let b = gl.createBuffer();
				if(!b){
					throw new Exception("Failed to create buffer");
				}
				asset.buffers.push(b);
				let loader = async ()=>{
					let data = await(await(await fetch(buffer.uri)).blob()).arrayBuffer();

					gl.bindBuffer(buffer.target, b);
					gl.bufferData(buffer.target, data, gl.STATIC_DRAW);

					if(buffer.resolve) buffer.resolve(b);
				};
				toLoad.push(loader());
			}

			for(let accessor of gltf.accessors){
				let a = new AssetAccessor();
				switch(accessor.type){
					case "SCALAR":
						a.size = 1;
						break;
					case "VEC2":
						a.size = 2;
						break;
					case "VEC3":
						a.size = 3;
						break;
					case "VEC4":
						a.size = 4;
						break;
					case "MAT2":
						a.size = 4;
						break;
					case "MAT3":
						a.size = 9;
						break;
					case "MAT4":
						a.size = 16;
						break;
				}
				a.componentType = accessor.componentType;
				a.offset = accessor.byteOffset || a.offset;
				a.elementCount = accessor.count;
				a.normalized = accessor.normalized || a.normalized;
				a.bufferView = accessor.bufferView;
			}

			for(let mesh of gltf.meshes){
				let m = new Mesh3d();

				for(let prim of mesh.primitives){
					let p = new Mesh3dPrimitive();

					p.mode = prim.mode || p.mode;
					if(prim.material) p.material = prim.material;
					if(prim.indices) p.indices = asset.accessors[prim.indices];	//	Accessor by id
					for(let [k,v] of Object.entries(prim.attributes)){
						p.attributes.set(k, asset.accessors[v]);	//	Accessor by id
					}

					m.primitives.push(p);
				}

				if(mesh.weights) m.weights = mesh.weights;
				asset.meshes.push(m);
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
	constructor(manager){
		this.manager = manager;
	}
	initSceneWithProgram(scene, program){
		let gl = this.manager.gl;
		let scene = structuredClone(scene);

		for(let [aname, aprop] of this){						//	ToDo: Finish loading models into gpu
			let location = gl.getAttribLocation(program, aname);
			gl.vertexAttribPointer(location, size, type, normalized, stride, offset)	
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
class AssetAccessor {
	bufferView = null;
	offset = 0;
	componentType = 0;
	normalized = false;
	elementCount = 0;
	size = 0;
	//max = [];	//	Not needed?
	//min = [];	//	Not needed?
	//sparse = null;	//	Not supported yet
}
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