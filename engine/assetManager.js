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

	loadModel(path, id, shader){
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
					dataBuffer.dataReady = (async()=>(await (await (await fetch(dataBuffer.uri)).blob()).arrayBuffer()))();
				}
				accessor.componentSize = WEBGL_DATATYPE_SIZES[accessor.componentType];
				let dataSize = WEBGL_DATATYPE_SIZES[accessor.type] * accessor.componentSize;
				accessor.dataSize = dataSize;
				let bufferOffset = (view.byteOffset || 0) + (accessor.byteOffset || 0);
				let stride = view.byteStride || dataSize;

				accessor.dataReady = dataBuffer.dataReady.then(async(data)=>{
					data = new Uint8Array(data);
					accessor.data = data;

					function* getReader(max){
						let offset = bufferOffset;
						let count = accessor.count;
						if(max) count = Math.min(count, max);

						for(let i=0;i<count;i++){
							let result = new Uint8Array(dataSize);
							for(let o=0; o<dataSize; o++){
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

			//	Set up the EBO buffer
			//		- Find accessors which need allocation
			let elementAccessors = new Set();
			for(let mesh of gltf.meshes){
				for(let primitive of mesh.primitives){
					if(primitive.indices) elementAccessors.add(primitive.indices);
				}
			}
			if(elementAccessors.size > 0){
			//		- Allocate accessors
				let accessors = Array.from(elementAccessors);
				accessors.sort((a,b)=>(gltf.accessors[b].dataSize - gltf.accessors[a].dataSize));
				let pointer = 0;
				for(let accessorid of accessors){
					let accessor = gltf.accessors[accessorid];
					accessor.elementAllocation = {offset:pointer, size: (accessor.dataSize * accessor.count), type:accessor.componentType};
					pointer += accessor.dataSize * accessor.count;
				}
			//		- Populate EBO
				let dataBuffer = new Uint8Array(pointer);
				for(let accessorid of accessors){
					let accessor = gltf.accessors[accessorid];
					let pointer = accessor.elementAllocation.offset;
					for(let bytes of accessor.getReader()){
						for(let i=0; i<accessor.dataSize; i++){
							dataBuffer[pointer++] = bytes[i];
						}
					}
				}
			//		- Copy over allocation data into the primitive object
				for(let mesh of gltf.meshes){
					for(let primitive of mesh.primitives){
						if(primitive.indices) {
							primitive.elementAllocation = gltf.accessors[primitive.indices].elementAllocation;
							primitive.renderCount = gltf.accessors[primitive.indices].count;
						}
					}
				}
			//		- Allocate EBO and upload data
				let ebo = this.gl.createBuffer();
				this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, ebo);
				this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, dataBuffer, this.gl.STATIC_DRAW);
				asset.ebo = ebo;
			}


			//	Set up the VBO buffers
			//		- Split accessors by datatype size

			let attributeAllocations = [];
			for(let mesh of gltf.meshes){
				for(let primitive of mesh.primitives){
					let allocations = {};
					primitive.attributeInstanceCount = Infinity;
					attributeAllocations.push(allocations);
					primitive.allocations = allocations;
					for(let [accessorid, accessor] of Object.entries(primitive.attributes)){
						accessor = gltf.accessors[accessor];

						if (!allocations[accessor.componentSize]){
							allocations[accessor.componentSize] = { offset: 0, size: 0, accessors: {}, primitive};
						}
						let allocation = allocations[accessor.componentSize];
						allocation.accessors[accessorid] = accessor;
						allocation.size += accessor.dataSize * accessor.count;
						primitive.attributeInstanceCount = Math.min(primitive.attributeInstanceCount, accessor.count);
					}
				}
			}

			//		- Calculate aligned bases for each datatype size
			let datasize_base_pointer = 0;
			let data_allocated = 0;
			let pointers = {};
			let types = [];
			for(let allocations of attributeAllocations){
				for(let [k,v] of Object.entries(allocations)){
					if(!pointers[k]){
						pointers[k] = {size:0, base:0, pointer:0};
						types.push(+k);
					}
					pointers[k].size += v.size;
				}
			}
			types.sort((a,b)=>(b - a));
			for(let type of types){
				let aligned_pointer = Math.ceil(datasize_base_pointer/type)*type;
				data_allocated += aligned_pointer - datasize_base_pointer;

				pointers[type].base = aligned_pointer;
				datasize_base_pointer = aligned_pointer + pointers[type].size;
				data_allocated += pointers[type].size;
			}
			for(let allocations of attributeAllocations){
				for(let [type, allocator] of Object.entries(allocations)){
					allocator.offset = pointers[type].pointer + pointers[type].base;
					pointers[type].pointer += allocator.size;
				}
			}

			//		- Allocate attributes to sub-buffers
			for(let allocations of attributeAllocations){
				for(let [size, allocationInfo] of Object.entries(allocations)){
					allocationInfo.primitive.attributeAllocations = allocationInfo.primitive.attributeAllocations || {};
					let accessors = Object.entries(allocationInfo.accessors);
					accessors.sort((a,b)=>{
						let ai;
						let bi;
						switch(a){
							case "POSITION":
								ai = 0;
								break;
							case "NORMAL":
								ai = 1;
								break;
							case "TANGENT":
								ai = 2;
								break;
							default:
								ai = 3;
								break;
						}
						switch(b){
							case "POSITION":
								bi = 0;
								break;
							case "NORMAL":
								bi = 1;
								break;
							case "TANGENT":
								bi = 2;
								break;
							default:
								bi = 3;
								break;
						}
						return bi-ai;
					});
					let offset = 0;
					for(let i=0;i<accessors.length;i+=16){
						let chunk = accessors.splice(i,i+16);
						let localOffset = 0;
						for(let [name, attribute] of chunk){
							let alloc = {
								offset: (offset + localOffset + allocationInfo.offset),
								stride: 0,
								componentType: attribute.componentType,
								componentCount: WEBGL_DATATYPE_SIZES[attribute.type],
								normalized: attribute.normalized || false,
								accessor: attribute
							};
							allocationInfo.primitive.attributeAllocations[name] = alloc;
							localOffset += attribute.dataSize;
						}
						for(let [name, attribute] of chunk){
							allocationInfo.primitive.attributeAllocations[name].stride = localOffset
						}
						offset += localOffset * allocationInfo.primitive.attributeInstanceCount;
					}
				}
			}


			//	Create and populate VBO data buffers
			let bufferData = new Uint8Array(data_allocated);
			for(let mesh of gltf.meshes){
				for(let primitive of mesh.primitives){
					for(let [name, attribute] of Object.entries(primitive.attributeAllocations)){
						let offset = attribute.offset;
						for(let bytes of attribute.accessor.getReader(primitive.attributeInstanceCount)){
							for(let i=0;i<bytes.byteLength;i++){
								bufferData[offset+i] = bytes[i];
							}
							offset += attribute.stride;
						}
					}
					primitive.renderCount = primitive.renderCount || primitive.attributeInstanceCount;
				}
			}
			asset.vbo = this.gl.createBuffer();
			this.gl.bindBuffer(this.gl.ARRAY_BUFFER, asset.vbo);
			this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);


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
			for(let mesh of gltf.meshes){
				let m = new Mesh3d(asset);
				for(let primitive of mesh.primitives){
					let prim = new Mesh3dPrimitive(m);
					prim.attributes = primitive.attributeAllocations;
					prim.indices = primitive.elementAllocation || null;
					prim.material = gltf.materials[primitive.material];
					prim.primitiveType = primitive.mode || 4;
					prim.count = primitive.renderCount;
					if(primitive.targets) console.error("Morph targets for meshes are not supported. Ignoring...");
					m.primitives.push(prim);
				}
				asset.meshes.push(m);
			}

			asset.defaultScene = asset.scenes[gltf.scene];

			await Promise.all(toLoad);
			
			asset.bindShader(shader);

			//console.log(gltf);
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
	shader = null;

	scenes = [];
	defaultScene = null;
	nodes = [];
	meshes = [];
	accessors = [];
	buffers = [];
	vbo = null;
	ebo = null;
	attributeParamaters = new Map();
	constructor(manager){
		this.manager = manager;
	}
	bindShader(shader){
		let attribMap = new Map();
		let oldAttribMap = new Map();
		let gl  = this.manager.gl;

		for(let mesh of this.meshes){
			for(let prim of mesh.primitives){
				if(prim.vao === null){
					prim.vao = gl.createVertexArray();
					gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
				}
				gl.bindVertexArray(prim.vao);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

				for(let [name, attrib] of Object.entries(prim.attributes)) {
					let location = attribMap.get(name);
					if(location === undefined){
						location = gl.getAttribLocation(shader, name);
						attribMap.set(name, location);
					}
					if(location == -1){
						let oldLocation = oldAttribMap.get(name);
						if(oldLocation === undefined){
							if(this.shader === null){
								oldLocation = -1;
								oldAttribMap.set(name, oldLocation);
								continue;
							}
							oldLocation = gl.getAttribLocation(this.shader, name);
							oldAttribMap.set(name, oldLocation);
						}
						if(oldLocation != -1) gl.disableVertexAttribArray(oldLocation);
						continue;
					}
					gl.enableVertexAttribArray(location);
					gl.vertexAttribPointer(location, attrib.componentCount, attrib.componentType, attrib.normalized, attrib.stride, attrib.offset);
				}
			}
		}
		gl.bindVertexArray(null);
		this.shader = shader;
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
	attributes = {};
	indices = null;
	material = null;
	morphTargets = null;
	count = 0;
	mesh = null;
	vao = null;
	constructor(mesh){
		this.mesh = mesh;
	}
}