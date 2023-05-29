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
	ALPHA_OPAQUE = 0;
	ALPHA_MASK = 1;
	ALPHA_BLEND = 2;
	objectHandler = {};

	gl = null;
	modelMap = new Map();

	constructor(gl){
		this.gl = gl;
		_gl = gl;
		_assetManager = this;
	}
	correctObject(obj){
		let proxy = new Proxy(obj, this.objectHandler);
		obj._proxy = proxy;
		return proxy;
	}

	loadModel(path, id, shader, shaderInfo){	//	path can either represent a path to a file or a parsed gltf object
		if(this.modelMap.has(id)) {
			let e = async()=>this.modelMap.get(id);
			return e();
		}
		let asset = new ModelAsset(this);

		asset.path = path;
		let loader = async (gltf)=>{
			await shader;
			shader = await shader;
			let gl = this.gl;
			let toLoad = [];

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


			for(let texture of gltf.textures){
				let image = gltf.images[texture.source];

				texture.data = new Uint8Array([255,0,255,255]);
				texture.width = 1;
				texture.height = 1;

				if(image.loader){
					let promise = image.loader.then((img)=>{
						texture.data = img;
					});
					toLoad.push(promise);
					continue;
				}
				if(image.uri){
					let promise = new Promise((resolve,reject)=>{
						let img = new Image();
						let uri = image.uri;
						img.src = uri;
						img.onload = ()=>{
							texture.data = img;
							texture.width = img.width;
							texture.height = img.height;
							resolve(img);
						}
						img.onerror = (e)=>{
							let img = new Image();
							img.src = "./"+uri;
							img.onload = ()=>{
								texture.data = img;
								texture.width = img.width;
								texture.height = img.height;
								resolve(img);
							}
							img.onerror = (e)=>{
								console.error("Failed to load texture: ",e);
								reject(e);
							}
						}
					});
					image.loader = promise;
					toLoad.push(promise);
					continue;
				}
				if(image.bufferView != undefined){	//	Convert bytes from buffer into a base64 string, then into a data uri, and then load as an img element.
					let promise = new Promise(async (resolve,reject)=>{
						let offset = gltf.bufferViews[image.bufferView].byteOffset;

						let buffer = await gltf.buffers[gltf.bufferViews[image.bufferView].buffer].dataReady;
						let bytes = new Uint8Array(buffer.slice(offset, offset + gltf.bufferViews[image.bufferView].byteLength));
						let uri = "data:" + image.mimeType + ";base64," + btoa(String.fromCharCode(...bytes));

						let img = new Image();
						img.src = uri;
						img.onload = ()=>{
							texture.data = img;
							texture.width = img.width;
							texture.height = img.height;
							resolve(img);
						}
						img.onerror = (e)=>{
							console.error("Failed to load texture: ",e);
							reject(e);
						}
					});
					image.loader = promise;
					toLoad.push(promise);
					continue;
				}
				console.error("Image data stored in an unsupported format.");
				alert("Image data stored in an unsupported format. Model will be loaded without invalid textures.");
			}

			await Promise.all(toLoad);
			toLoad = [];
			gl.bindVertexArray(null);	//	Prevent this function from overwriting VAOs which could still be bound

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

			for(let texture of gltf.textures){
				let sampler = gltf.samplers[texture.sampler];
				texture.sampler = sampler;
				let tex = this.gl.createTexture();	//	Create webgl texture
				sampler.texture = tex;

				this.gl.bindTexture(this.gl.TEXTURE_2D, tex);	//	Upload image to texture
				this.gl.texImage2D(
					this.gl.TEXTURE_2D,
					0,
					this.gl.RGBA,
					texture.width,
					texture.height,
					0,					//	This can be set to any value as long as this value is 0 - WebGL api
					this.gl.RGBA,
					this.gl.UNSIGNED_BYTE,
					texture.data);

				function isPowerOf2(value) {
					return (value & (value - 1)) === 0;
				}

				if(isPowerOf2(texture.width) && isPowerOf2(texture.height)){
					this.gl.generateMipmap(this.gl.TEXTURE_2D);		//	Generate mipmaps for texture if its dimensions are powers of 2
				}

				if(sampler.sampler === undefined){
					sampler.sampler = this.gl.createSampler();
					this.gl.samplerParameteri(sampler.sampler, this.gl.TEXTURE_WRAP_S, sampler.wrapS || 10497);
					this.gl.samplerParameteri(sampler.sampler, this.gl.TEXTURE_WRAP_T, sampler.wrapT || 10497);
					if(sampler.magFilter) this.gl.samplerParameteri(sampler.sampler, this.gl.TEXTURE_MAG_FILTER, sampler.magFilter);
					if(sampler.minFilter) this.gl.samplerParameteri(sampler.sampler, this.gl.TEXTURE_MIN_FILTER, sampler.minFilter);
				}
				texture.texture = tex;
				//gl.bindSampler when binding the texture
			}

			for(let node of gltf.nodes){
				let n = new AssetNode3D();
				n.translation = node.translation || n.translation;
				n.rotation = node.rotation || n.rotation;
				n.scale = node.scale || n.scale;
				n.name = node.name;

				n.children = node.children || [];
				if(typeof(node.mesh) == "number") n.mesh = node.mesh;
				//if(typeof(node.mesh) == "number") n.mesh = asset.meshes[node.mesh];
				asset.nodes.push(n);
				//	Load all nodes. Load each node through iterration, then fill in references to their children afterwards to make sure each node is only loaded once, and they are in the correct order.
				//	Node transforms are not global transformations, meaning that each node is affected by their parent's transformation. They appear to get applied just before a node is rendered
			}

			for(let node of asset.nodes){
				node.children = node.children.map((index)=>asset.nodes[index]);
			}


			for(let scene of gltf.scenes){
				if(scene.nodes.length > 1 || (scene.nodes.length === 1 && asset.nodes[scene.nodes[0]].name && scene.name)){
					let s = new AssetNode3D();
					s.name = scene.name;
					s.children = scene.nodes.map((index)=>asset.nodes[index]);
					asset.scenes.push(s);
				}else if(scene.nodes.length === 1){
					let s = asset.nodes[scene.nodes[0]];
					s.name = s.name || scene.name;
					asset.scenes.push(s);
				}
			}
			for(let mesh of gltf.meshes){
				let m = new AssetMesh3d(asset);
				for(let primitive of mesh.primitives){
					let prim = new AssetMesh3dPrimitive(m);
					prim.attributes = primitive.attributeAllocations;
					prim.indices = primitive.elementAllocation || null;
					prim.material = gltf.materials[primitive.material];
					prim.primitiveType = primitive.mode || 4;
					prim.count = primitive.renderCount;
					if(primitive.targets) console.error("Morph targets for meshes are not supported. Ignoring...");
					m._primitives.push(prim);
				}
				asset.meshes.push(m);
			}
			for(let node of asset.nodes){
				if(node.mesh !== null) node.mesh = asset.meshes[node.mesh];
			}

			for(let texture of gltf.textures){
				if(texture.data) asset.textures.push(texture);	//	Load data into webgl here
			}

			for(let material of gltf.materials){
				if(!material.pbrMetallicRoughness){
					material.pbrMetallicRoughness = {}
				}
				let pbr = material.pbrMetallicRoughness;

				pbr.baseColorFactor = pbr.baseColorFactor || [1,1,1,1];
				pbr.metallicFactor = pbr.metallicFactor || 1;
				pbr.roughnessFactor = pbr.roughnessFactor || 1;

				material.alphaMode = this["ALPHA_" + (material.alphaMode || "OPAQUE")];
				material.alphaCutoff = material.alphaCutoff || 0.5;
				if(!material.alphaCutoff) material.alphaCutoff = -1;
				material.doubleSided = material.doubleSided || false;
				material.emissiveFactor = material.emissiveFactor || [0,0,0];

				material.uniforms = {
					u_baseColorFactor: pbr.baseColorFactor,
					u_alphaCutoff: material.alphaCutoff,
					u_metallicFactor: pbr.metallicFactor,
					u_roughnessFactor: pbr.roughnessFactor,
					u_emissiveFactor: material.emissiveFactor,
				};

				material.textures = {};
				if(pbr.baseColorTexture){
					let unit = pbr.baseColorTexture.texCoord || 0;
					let texture = gltf.textures[pbr.baseColorTexture.index];

					let textureInfo = {
						unit,
						samplerUniform: null,
						texture: texture.texture,
						sampler: texture.sampler.sampler,
						samplerUniform: shaderInfo.colorSampler || "u_colorSampler"
					};
					material.textures.color = textureInfo;
					material.textureInfos = material.textureInfos || [];
					material.textureInfos.push(textureInfo);

					shaderInfo.colorSampler = null;
				}
				asset.materials.push(material);
			}

			asset.defaultScene = gltf.scene;

			//	Load Animations

			for(let animation of (gltf.animations || [])){
				for(let sampler of animation.samplers){
					let input = gltf.accessors[sampler.input];

					let ab = new ArrayBuffer(input.dataSize * input.count);
					let keyframes_data = new Uint8Array(ab);
					let pointer = 0;
					for(let bytes of input.getReader()){
						for(let b of bytes){
							keyframes_data[pointer++] = b;
						}
					}
					sampler.keyframes = new Float32Array(ab);
					if(input.max){
						sampler.playTime = input.max[0];
					}else{
						sampler.playTime = 0;
						for(let timeStamp of sampler.keyframes){
							sampler.playTime = Math.max(timeStamp, sampler.playTime);
						}
					}

					let output = gltf.accessors[sampler.output];
					ab = new ArrayBuffer(output.dataSize * output.count);
					sampler.stride = output.dataSize / output.componentSize;

					keyframes_data = new Uint8Array(ab);
					pointer = 0;
					for(let bytes of output.getReader()){
						for(let b of bytes){
							keyframes_data[pointer++] = b;
						}
					}
					sampler.values = new Float32Array(ab);
				}
			}

			for(let animation of (gltf.animations || [])){
				let anim = new Map();
				anim.playTime = 0;
				for(let achannel of animation.channels){
					let target = achannel.target;
					let node = asset.nodes[target.node];
					let animInfo = anim.get(node) || {};
					let sampler = animation.samplers[achannel.sampler];
					anim.playTime = Math.max(sampler.playTime, anim.playTime);
					if(target.path == "translation")target.path = "position";
					animInfo[target.path] = sampler;

					anim.set(node, animInfo);
				}
				asset.animations.set(animation.name, anim);
			}


			await Promise.all(toLoad);

			asset.bindShader(shader, shaderInfo);

			asset.ready = true;
			asset.loader = null;
		};

		if(typeof(path) === "string"){
			asset.loader = fetch(path).then((gltf)=>gltf.json()).then(loader);
		}else{
			asset.loader = loader(path);
		}


		this.modelMap.set(id, asset);
		return asset.loader.then(()=>asset);
	}
	async generateObject3(asset_id, scene, params){
		let asset = this.modelMap.get(asset_id);
		if(asset.loader) await asset.loader;
		return asset.generateObject3(scene, params);
	}
	async finishedLoading(){
		let toLoad = [];
		for(let [k, asset] of this.modelMap.entries()){
			if(asset.loader) toLoad.push(asset.loader);
		}
		await Promise.all(toLoad);
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
	animations = new Map();
	accessors = [];
	buffers = [];
	materials = [];
	textures=[];
	vbo = null;
	ebo = null;
	attributeParamaters = new Map();
	constructor(manager){
		this.manager = manager;
	}
	bindShader(shader, nameTable){
		nameTable = nameTable || {};
		let attribMap = new Map();
		let oldAttribMap = new Map();
		let gl = this.manager.gl;
		let attribNameTable = new Map();
		if(nameTable.position) attribNameTable.set("POSITION", nameTable.position);
		if(nameTable.normal) attribNameTable.set("NORMAL", nameTable.normal);
		if(nameTable.tangent) attribNameTable.set("TANGENT", nameTable.tangent);

		for(let mesh of this.meshes){
			for(let prim of mesh._primitives){
				if(nameTable.colorTexCoord && prim.material.pbrMetallicRoughness.baseColorTexture) attribNameTable.set("TEXCOORD_"+(prim.material.pbrMetallicRoughness.baseColorTexture.texCoord || 0), nameTable.colorTexCoord);

				if(prim.vao === null){
					prim.vao = gl.createVertexArray();
				}
				gl.bindVertexArray(prim.vao);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
				gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);

				prim.offset = Infinity;
				for(let [aname, attrib] of Object.entries(prim.attributes)) {
					let name = attribNameTable.get(aname) || aname;
					prim.offset = Math.min(prim.offset, attrib.offset);
					let location = attribMap.get(name);
					if(location === undefined){
						location = gl.getAttribLocation(shader.program, name);
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
							oldLocation = gl.getAttribLocation(this.shader.program, name);
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
		for(let material of this.materials){
			for(let texInfo of material.textureInfos){
				if(typeof(texInfo.samplerUniform)=="string"){
					texInfo.samplerUniform = gl.getUniformLocation(shader.program, texInfo.samplerUniform);
				}
			}
		}
		gl.bindVertexArray(null);
		this.shader = shader;
	}
	
	generateObject3(scene, params){
		if(scene === undefined) scene = this.defaultScene;

		let nodeMap = new Map();

		function createObject(node, params){
			let obj;
			let parameters = params || {position: node.translation, rotation: node.rotation, scaling: node.scale, name:node.name};
			if(node.mesh){
				obj = new Mesh3d(node.mesh, parameters);
			}else{
				obj = new Object3(parameters);
			}
			obj = _assetManager.correctObject(obj);
			nodeMap.set(node, obj);
			for(let child of node.children){
				obj.appendChild(createObject(child));
			}
			return obj;
		}

		let result = createObject(this.scenes[scene], params);
		if(this.animations.size){
			let animations = new Map();
			for(let [name, animation] of this.animations.entries()){
				let sequences = new Map();
				sequences.playTime = animation.playTime;

				for(let [node, sequence] of animation.entries()){
					let obj = nodeMap.get(node);
					if(!obj) continue;

					sequences.set(obj, sequence);
				}

				animations.set(name, sequences);
			}
			let player = new AnimationPlayer(result, animations);
			result.animationPlayer = player;
		}

		return result;
	}
}
class AssetNode3D {
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
}
class AssetMesh3d{
	_asset = null;
	_primitives = [];
	_weights = null;
	constructor(asset){
		this._asset = asset;
	}
}
class Mesh3d extends Object3 {
	_mesh = null;
	constructor(mesh, args){
		super(args);
		this._mesh = mesh;
	}
}
class AssetMesh3dPrimitive {
	primitiveType = 4;	//	Describes the type of primitive to render (default 4 for gl.TRIANGLES)
	attributes = {};
	indices = null;
	material = null;
	morphTargets = null;
	count = 0;
	offset = 0;
	mesh = null;
	vao = null;
	constructor(mesh){
		this.mesh = mesh;
	}
}