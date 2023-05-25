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
	const object_property_descriptor_template = document.getElementById("object_property_descriptor_template").content.children[0];
	const array_property_descriptor_template = document.getElementById("array_property_descriptor_template").content.children[0];
	const object_descriptor_template = document.getElementById("object_descriptor_template").content.children[0];
	const vector_descriptor_template = document.getElementById("v3_descriptor_template").content.children[0];
	const single_descriptor_template = document.getElementById("single_descriptor_template").content.children[0];
	const null_descriptor_template = document.getElementById("null_descriptor_template").content.children[0];

	let proxy_map = new Map();

	function generateDescriptor(obj, container, propData, reset){	//	Assumes container is controlled by this function alone
		propData ||= {};
		let proxy, prop_map, redo;
		let proxy_data = proxy_map.get(obj);
		if(proxy_data && !reset){
			[prop_map, redo, _] = proxy_data;
			proxy = obj;
		}else{
			prop_map = new Map();	//	key: name,  value: onUpdate()

			for(let [prop_name, prop_value] of Object.entries(obj)){
				if(prop_name.startsWith("_")) continue;
				let onUpdate;
				let skip = false;
				let node;
				switch(typeof(prop_value)){
					case "number":
						{
							node = single_descriptor_template.cloneNode(true);
							let inp = node.querySelector("input");
							if(propData[prop_name] && propData[prop_name].name){
								node.querySelector(".property_name").innerText = propData[prop_name].name;
							}else{
								node.querySelector(".property_name").innerText = prop_name;
							}
							inp.type = "number";
							if(propData[prop_name]){
								if(propData[prop_name].step !== undefined) inp.step = propData[prop_name].step;
								if(propData[prop_name].min !== undefined) inp.min = propData[prop_name].min;
								if(propData[prop_name].max !== undefined) inp.max = propData[prop_name].max;
							}
							onUpdate = ()=>{
								inp.valueAsNumber = +obj[prop_name];
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, +obj[prop_name]);
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.valueAsNumber;
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, event.target.valueAsNumber);
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "string":
						{
							node = single_descriptor_template.cloneNode(true);
							let inp = node.querySelector("input");
							if(propData[prop_name] && propData[prop_name].name){
								node.querySelector(".property_name").innerText = propData[prop_name].name;
							}else{
								node.querySelector(".property_name").innerText = prop_name;
							}
							inp.type = "text";
							onUpdate = ()=>{
								inp.value = obj[prop_name];
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, obj[prop_name]);
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.value;
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, obj[prop_name]);
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "boolean":
						{
							node = single_descriptor_template.cloneNode(true);
							let inp = node.querySelector("input");
							if(propData[prop_name] && propData[prop_name].name){
								node.querySelector(".property_name").innerText = propData[prop_name].name;
							}else{
								node.querySelector(".property_name").innerText = prop_name;
							}
							inp.type = "checkbox";
							onUpdate = ()=>{
								inp.checked = obj[prop_name];
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, obj[prop_name]);
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.checked;
								if(propData[prop_name] && propData[prop_name].onUpdate) propData[prop_name].onUpdate(proxy||obj, event.target.checked);
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "function":
						skip = true;
						break;
					default:
						if(prop_value === null){
							skip=true;break; //	Toggle rendering of null properties
							node = null_descriptor_template.cloneNode(true);
							if(propData[prop_name] && propData[prop_name].name){
								node.querySelector(".property_name").innerText = propData[prop_name].name;
							}else{
								node.querySelector(".property_name").innerText = prop_name;
							}
							break;
						}
						if(prop_value instanceof Float32Array && prop_value.length === 3){
							onUpdate = ()=>{
								let vector_proxy_handler = prop_value["__proxyHandler"] || {};
								let originalObject = prop_value["__originalObject"];
								if(originalObject){
									obj[prop_name] = originalObject;
									prop_value = originalObject;
								}

								let lastNode = node;
								node = vector_descriptor_template.cloneNode(true);
								let inputs = node.querySelectorAll("input");

								if(propData[prop_name] && propData[prop_name].name){
									node.querySelector(".property_name").innerText = propData[prop_name].name;
								}else{
									node.querySelector(".property_name").innerText = prop_name;
								}

								inputs[0].valueAsNumber = +obj[prop_name][0];
								inputs[1].valueAsNumber = +obj[prop_name][1];
								inputs[2].valueAsNumber = +obj[prop_name][2];

								
								vector_proxy_handler.set = (o,n,v) => {
										o[n] = v;
										switch(n) {
											case "0":
												inputs[0].valueAsNumber = v;
												break;
											case "1":
												inputs[1].valueAsNumber = v;
												break;
											case "2":
												inputs[2].valueAsNumber = v;
												break;
										}
										return true;
									};
								
								vector_proxy_handler.get = (o,n)=>{
										switch(n){
											case "__originalObject":
												return o;
											case "__proxyHandler":
												return vector_proxy_handler;
											default:
												return o[n];
										};
									};
								let vector_proxy = new Proxy(obj[prop_name], vector_proxy_handler);
								
									
								let prop_data = propData[prop_name] || {};

								for(let i=0; i<3; i++){
									let inp = inputs[i];
									let changeListener = (event)=>{
										let val = event.target.valueAsNumber;
										if(!Number.isNaN(val)) obj[prop_name][i] = val;
									};
									inp.addEventListener("change", changeListener, { passive:true });
									if(prop_data.step !== undefined) inp.step = prop_data.step;
									if(prop_data.min !== undefined) inp.min = prop_data.min;
									if(prop_data.max !== undefined) inp.max = prop_data.max;
								}
								obj[prop_name] = vector_proxy;
								
								if(lastNode){
									lastNode.replaceWith(node);
								}
							};
							break;
						}
						skip = true;
						break;
				}
				if(skip) continue;
				if(onUpdate) {
					prop_map.set(prop_name, onUpdate);
					onUpdate();
				}
				container.appendChild(node);
			}


			let handler = {
				set: (o, name, val)=>{
					let old = o[name];
					o[name] = val;
					if(old === val) return true;
					let onUpdate = prop_map.get(name);
					if(!onUpdate || val === undefined || old === undefined || val.__proto__ !== old.__proto__){
						redo();
					}else{
						onUpdate();
					}
					return true;
				}
			};
			proxy = new Proxy(obj, handler);
		}
		redo = ()=>{
			while(container.firstChild){
				container.removeChild(container.lastChild);
			}
			generateDescriptor(proxy, container, propData, true);
		};
		proxy_map.set(proxy, [prop_map, redo, container]);
		return proxy;
	}

	function cleanProxyMaps(){
		let toClean = [];
		for(let [proxy, [prop_map, redo, container]] of Object.entries(proxy_map)){
			if(!document.contains(container)){
				toClean.push(proxy);
			}
		}
		while(toClean.length){
			proxy_map.delete(toClean.pop());
		}
	}

	let windows = document.querySelectorAll(".window");
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}

	setInterval(cleanProxyMaps, 5000);

	//let oc = document.getElementById("object_children");
	//_globalScene.name = "Scene Parent";
	//_globalScene = generateDescriptor(_globalScene, oc, {name:{onUpdate:(p,n)=>}});
	const object_window_template = document.getElementById("object_window_template").content.children[0];
	const draggables_container = document.getElementById("draggables_container");

	let object_window_map = new Map();
	setInterval(()=>{
		let toChange = [];
		for(let i=0; i<_globalScene.children.length; i++){
			let child = _globalScene.children[i];

			if(!object_window_map.has(child)){
				toChange.push(i);
			}
		}
		for(let index of toChange){
			let child = _globalScene.children[index];
			let window = object_window_template.cloneNode(true);
			let title = window.querySelector(".object_name");

			let oc = window.querySelector(".object_children");

			if(!child.name){
				if(child instanceof LightSource3D){
					child.name = "Light "+(lightId++);
					//console.log(child);
				}
			}
			let propertyData = {
				name:{
					onUpdate: (obj, name)=>{
						title.innerText = name;
					}
				}
			};
			if(child instanceof LightSource3D){
				propertyData.lightColor = { min:0, max:1, step: 0.01, name: "Light Color"};
				propertyData.ambientInfluence = { min:0, max:1, step: 0.01, name: "Ambient Light Influence"};
				propertyData.specularInfluence = { min:0, max:1, step: 0.01, name: "Specular Light Influence"};
				propertyData.diffuseInfluence = { min:0, max:1, step: 0.01, name: "Diffuse Light Influence"};
			}

			let obj = generateDescriptor(child, oc, propertyData);
			_globalScene.children[index] = obj;

			draggables_container.appendChild(window);
			object_window_map.set(obj, window);
			window.querySelector(".delete_object_button").addEventListener("click", ()=>{
				let index = _globalScene.children.indexOf(obj);
				console.log(index, obj, child);
				if(index === -1) return;
				_globalScene.removeChild(obj);
				window.remove();
			});
			addWindow(window);
		}
		toChange.length = 0;

		for(let [obj, window] of object_window_map.entries()){
			if(!_globalScene.children.includes(obj)){
				toChange.push(obj);
			}
		}
		for(let obj of toChange){
			let window = object_window_map.get(obj);
			window.remove();
			object_window_map.delete(obj);
		}
	}, 250);

	//oc.appendChild(createObject3Descriptor(_globalScene));
