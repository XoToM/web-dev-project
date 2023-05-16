function addWindow(elem){
	let header = elem.querySelector(":scope>summary");

	let mouseX, mouseY;
	let moved = 0;
	let last = true;

	function onClick(e){
		if(moved > 0){
			e.preventDefault();
			elem.open = last;
			return false;
		}
	}

	function onDragStart(e){
		document.onmousemove = onDrag;
		document.onmouseup = onDragEnd;

		mouseX = e.clientX;
		mouseY = e.clientY;
		last = elem.open;
		moved = 0;

		e.preventDefault();
	}
	function onDrag(e){
		let ny = (e.clientY - mouseY);
		let nx = (e.clientX - mouseX);
		moved += Math.abs(nx) + Math.abs(ny);
		elem.style.top = (elem.offsetTop + ny) + "px";
		elem.style.left = (elem.offsetLeft + nx) + "px";
		mouseX = e.clientX;
		mouseY = e.clientY;
		e.preventDefault();
	}
	function onDragEnd(e){
		document.onmouseup = null;
		document.onmousemove = null;
		if(moved > 0){
			e.preventDefault();
			elem.open = last;
		}
	}
	header.onmousedown = onDragStart;
	header.addEventListener("click", onClick);
}

	//	New scope because these are only needed for initialization
	let meshId = 0;
	let objId = 0;
	let lightId = 0;
	const object_descriptor_template = document.getElementById("object_descriptor_template").content.children[0];
	let objectMap = new Map();
	
	function createObject3Descriptor(obj){
		let node = object_descriptor_template.cloneNode(true);
		objectMap.set(obj._proxy, node);
		obj.position = obj.position;
		obj.rotation = obj.rotation;
		
		let positions = node.querySelectorAll(".object_position input");
		for(let i=0; i<positions.length; i++){
			let element = positions[i];
			element.addEventListener("change", (event) => { 
				if(event.target.valueAsNumber != NaN) obj.position[i] = event.target.valueAsNumber;
				return true;
			});
		}
		let rotations = node.querySelectorAll(".object_rotation input");
		for(let i=0; i<rotations.length; i++){
			let element = rotations[i];
			element.addEventListener("change", (event) => { 
				if(event.target.valueAsNumber != NaN) obj.rotation[i] = event.target.valueAsNumber;
				return true;
			});
		}
		

		let children_node = node.querySelector(".children_list");
		for(let child of obj.children){
			let n = objectMap.get(child);
			if(!n){
				n = createObject3Descriptor(child);
			}
			children_node.appendChild(n);
		}

		return node;
	}

	_assetManager.objectHandler.set = (obj, prop, value) => {
		let elem;
		let proxy;
		switch(prop){
			case "position":
				elem = objectMap.get(obj._proxy);
				if(!elem) break;
				let positions = elem.querySelector(".object_position");

				proxy = new Proxy(value, {
					set: (o,prop,value)=>{
						if(+prop !== NaN){
							positions.children[+prop+1].value = value;
							o[prop] = value;
						}
						return true;
					}
				});
				proxy[0] = proxy[0];
				proxy[1] = proxy[1];
				proxy[2] = proxy[2];

				break;
			case "rotation":
				elem = objectMap.get(obj._proxy);
				if(!elem) break;
				let rotations = elem.querySelector(".object_rotation");
				proxy = new Proxy(value, {
					set: (o,prop,value)=>{
						if(+prop !== NaN){
							rotations.children[+prop+1].value = value;
							o[prop] = value;
						}
						return true;
					}
				});
				proxy[0] = proxy[0];
				proxy[1] = proxy[1];
				proxy[2] = proxy[2];

				break;
			case "name":
				elem = objectMap.get(obj._proxy);
				if(!elem) break;
				if(!value){
					if(obj instanceof Mesh3d){
						value = "Mesh "+(meshId++);
					}else{
						if(obj instanceof Mesh3d){
							value = "Light "+(lightId++);
						}else{
							if(obj instanceof Object3){
								value = "Object "+(meshId++);
							}
						}
					}
					
				}
				let title = elem.querySelector(".object_name");
				title.innerText = value;
				obj.name = value;
				break;
		}
		obj[prop] = proxy || value;
		return true;
	};

	let windows = document.querySelectorAll(".window");
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}

	let oc = document.getElementById("object_children");
	oc.appendChild(createObject3Descriptor(_globalScene));
	_globalScene.name = "Scene Parent";
