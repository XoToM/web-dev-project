let __focusCounter = 1;
let windowAutoHide = true;

function addWindow(elem){
	let header = elem.querySelector(":scope>summary,:scope>.header");

	let mouseX, mouseY;
	let moved = 0;
	let last = true;

	function onClick(e){
		bringFront();
		if(moved > 0){
			e.preventDefault();
			elem.open = last;
			return false;
		}
		//bringFront();
	}

	function onDragStart(e){
		bringFront();
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
	function bringFront(){		//	Bring to front breaks minimizing windows
		//let parent = elem.parentNode;
		//parent.removeChild(elem);
		//parent.appendChild(elem);
		if(__focusCounter !== elem.style.zIndex) {
			__focusCounter++;
			elem.style.zIndex = __focusCounter;
		}
	}
	elem.bringToFront = bringFront;
	elem.showWindow = ()=>{
		elem.hidden = false;
	};
	elem.hideWindow = ()=>{
		elem.hidden = "until-found";
	};
	elem.showcaseWindow = ()=>{
		elem.open = true;
		elem.showWindow();
		elem.bringToFront();


		for(let child of elem.children){
			child.style.animation = "showcase-flash 0.5s ease-in-out";
			child.addEventListener("animationend", (event)=>{
				if(event.animationName === "showcase-flash") child.style.animation = "";
			}, {once:true});
		}
	};

	let close = header.querySelector(".close_window_button");
	if(close){
		close.addEventListener("click", elem.hideWindow);
	}

	if(!elem.classList.contains("no-drag")) header.onmousedown = onDragStart;
	header.addEventListener("click", onClick);
	elem.addEventListener("focusin", ()=>{bringFront()});
	return elem;
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

	
	const manager_button_template = document.getElementById("object_window_button_template").content.children[0];
	let window_button_map = new Map();
	const object_window_manager = document.getElementById("object_windows");


	let object_window_map = new Map();
	let object_window_update_handler = ()=>{
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
			let window_button = manager_button_template.cloneNode(true);
			let button_title = window_button.querySelector(".object_name");

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
						button_title.innerText = name;
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
				window_button.remove();
			});
			window_button.addEventListener("click", ()=>{
				window.showcaseWindow();
			});

			window_button_map.set(addWindow(window), window_button);
			object_window_manager.appendChild(window_button);
			window.managedObject3 = obj;

			if(windowAutoHide){
				window.hideWindow();
			}
		}
		toChange.length = 0;

		for(let [obj, window] of object_window_map.entries()){
			if(!_globalScene.children.includes(obj)){
				if(obj !== Camera) toChange.push(obj);
			}
		}
		for(let obj of toChange){
			let window = object_window_map.get(obj);
			let wbutton = window_button_map.get(window);
			if(wbutton) wbutton.remove();
			window_button_map.delete(window);
			object_window_map.delete(obj);
			window.remove();
		}
	};
	Camera.name = "Camera";
	_globalScene.children.push(Camera);		//	The camera object is not a normal object and cannot be removed. Since its not a part of the scene trying to remove it from the scene
	object_window_update_handler();
	Camera = _globalScene.children.pop();
	let cam_window = object_window_map.get(Camera);
	cam_window.querySelector(".delete_object_button").remove();

	setInterval(object_window_update_handler, 250);

	//oc.appendChild(createObject3Descriptor(_globalScene));
