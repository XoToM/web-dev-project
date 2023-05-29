let __focusCounter = 1;	//	Set up global variables
let windowAutoHide = true;

function addWindow(elem){		//	Set up the window to allow the user to drag it around. Also sets up extra features like closing windows.
	let header = elem.querySelector(":scope>summary,:scope>.header");

	let mouseX, mouseY;
	let moved = 0;
	let last = true;

	function onClick(e){	//	OnClick event handler for the window header
		bringFront();
		if(moved > 0){
			e.preventDefault();
			elem.open = last;
			return false;
		}
	}

	function onDragStart(e){	//	OnDragStart event handler for the window header
		bringFront();
		document.onmousemove = onDrag;
		document.onmouseup = onDragEnd;

		mouseX = e.clientX;
		mouseY = e.clientY;
		last = elem.open;
		moved = 0;

		e.preventDefault();
	}
	function onDrag(e){		//	OnDrag event handler for the window header
		let ny = (e.clientY - mouseY);
		let nx = (e.clientX - mouseX);
		moved += Math.abs(nx) + Math.abs(ny);
		elem.style.top = (elem.offsetTop + ny) + "px";
		elem.style.left = (elem.offsetLeft + nx) + "px";
		mouseX = e.clientX;
		mouseY = e.clientY;
		e.preventDefault();
	}
	function onDragEnd(e){		//	OnDragEnd event handler for the window header
		document.onmouseup = null;
		document.onmousemove = null;
		if(moved > 0){
			e.preventDefault();
			elem.open = last;
		}
	}
	function bringFront(){		//	Function which moves the window to be in front of all other windows
		if(__focusCounter !== elem.style.zIndex) {
			__focusCounter++;
			elem.style.zIndex = __focusCounter;
		}
	}
	elem.bringToFront = bringFront;
	elem.showWindow = ()=>{		//	Show window if closed. 
		elem.hidden = false;
	};
	elem.hideWindow = ()=>{
		elem.hidden = "until-found";	//	Not supported on firefox and defaults to true
	};
	elem.showcaseWindow = ()=>{		//	Highlight the window and make it flash to bring it to the user's attention
		elem.open = true;
		elem.showWindow();
		elem.bringToFront();


		for(let child of elem.children){	//	Play flashing animation if its not playing already
			child.style.animation = "showcase-flash 0.5s ease-in-out";
			child.addEventListener("animationend", (event)=>{
				if(event.animationName === "showcase-flash") child.style.animation = "";
			}, {once:true});
		}
	};

	let close = header.querySelector(".close_window_button");	//	Set up the close button if its present
	if(close){
		close.addEventListener("click", elem.hideWindow);
	}

	if(!elem.classList.contains("no-drag")) header.onmousedown = onDragStart;
	header.addEventListener("click", onClick);
	elem.addEventListener("focusin", ()=>{bringFront()});
	return elem;
}

	//	New scope because these are only needed for initialization
	let objId = 0;
	let lightId = 0;
	const object_property_descriptor_template = document.getElementById("object_property_descriptor_template").content.children[0];	//	Set up the needed object templates once so we don't have to look them up every time we add a property
	const array_property_descriptor_template = document.getElementById("array_property_descriptor_template").content.children[0];
	const object_descriptor_template = document.getElementById("object_descriptor_template").content.children[0];
	const vector_descriptor_template = document.getElementById("v3_descriptor_template").content.children[0];
	const single_descriptor_template = document.getElementById("single_descriptor_template").content.children[0];
	const null_descriptor_template = document.getElementById("null_descriptor_template").content.children[0];	//	Optional

	let proxy_map = new Map();

	function generateDescriptor(obj, container, propData, reset){	//	Links the properties of an object to html elements. Assumes the container element is controlled by this function alone
		propData ||= {};
		let proxy, prop_map, redo;
		let proxy_data = proxy_map.get(obj);
		if(proxy_data && !reset){		//	Check if the object already has a proxy assigned
			[prop_map, redo, _] = proxy_data;
			proxy = obj;
		}else{
			prop_map = new Map();	//	key: name,  value: onUpdate()

			for(let [prop_name, prop_value] of Object.entries(obj)){	//	Generate DOM elements for every property
				if(prop_name.startsWith("_")) continue;
				let onUpdate;
				let skip = false;
				let node;
				switch(typeof(prop_value)){	//	Set up a differet DOM element depending on the type of this property
					case "number":	//	Set up a numeric input and link it to this property through the proxy and events
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
					case "string":	//	Set up a text input and link it to this property through the proxy and events
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
					case "boolean":	//	Set up a checkbox and link it to this property through the proxy and events
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
					case "function":	//	if the property is a function we skip it. Functions cannot be rendered as DOM elements
						skip = true;
						break;
					default:
						if(prop_value === null){	//	If the propertyis null render it (optional, currently disabled through comments)
							skip=true;break; //	Comment/Uncomment this line to Enable/Disable rendering of null properties. I'm gonna leave it as disabld because it makes the ui a bit less cluttered
							node = null_descriptor_template.cloneNode(true);
							if(propData[prop_name] && propData[prop_name].name){
								node.querySelector(".property_name").innerText = propData[prop_name].name;
							}else{
								node.querySelector(".property_name").innerText = prop_name;
							}
							break;
						}
						if(prop_value instanceof Float32Array && prop_value.length === 3){	//	Set up the needed DOM elements for rendering vectors. These are a bit more compelex as object store them as Float32Array objects and we need 3 separate numeric inputs to display them. This means that when onUpdate fires we need to rebuild the entire vector display from scratch
							onUpdate = ()=>{	//	OnUpdate only fires when the property is changed, not when a property of a property is changed. This means that we need a separate proxy to detect changes to vectors
								let vector_proxy_handler = prop_value["__proxyHandler"] || {};
								let originalObject = prop_value["__originalObject"];
								if(originalObject){
									obj[prop_name] = originalObject;
									prop_value = originalObject;
								}

								let lastNode = node;
								node = vector_descriptor_template.cloneNode(true);
								let inputs = node.querySelectorAll("input");

								if(propData[prop_name] && propData[prop_name].name){		//	Set up the property name
									node.querySelector(".property_name").innerText = propData[prop_name].name;
								}else{
									node.querySelector(".property_name").innerText = prop_name;
								}

								inputs[0].valueAsNumber = +obj[prop_name][0];
								inputs[1].valueAsNumber = +obj[prop_name][1];
								inputs[2].valueAsNumber = +obj[prop_name][2];


								vector_proxy_handler.set = (o,n,v) => {	//	Set up the proxy to detect changes to the vector
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
								
								vector_proxy_handler.get = (o,n)=>{	//	Set up fake properties in case we need to access the vector directly, or if we need to modify the proxy handler
										switch(n){
											case "__originalObject":
												return o;
											case "__proxyHandler":
												return vector_proxy_handler;
											default:
												return o[n];
										};
									};
								let vector_proxy = new Proxy(obj[prop_name], vector_proxy_handler);	//	Generate the proxy
								
									
								let prop_data = propData[prop_name] || {};

								for(let i=0; i<3; i++){	//	Set up each of the numeric inputs, and detect if they change so we can update the object
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
								
								if(lastNode){	//	If we are only updating this property we should replace the existing DOM node instead of adding a new one at the end. It would be very annoying to use a UI which constantly rearranges itself
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
					prop_map.set(prop_name, onUpdate);	//	If the property defined an onUpdate method we should call it once to initialize everything
					onUpdate();
				}
				container.appendChild(node);
			}


			let handler = {	//	Set up a proxy to listen for changes to the javascript object
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
		redo = ()=>{	//	Used for rebuilding the entire object display from scratch. Usually used when something big changes
			while(container.firstChild){
				container.removeChild(container.lastChild);
			}
			generateDescriptor(proxy, container, propData, true);
		};
		proxy_map.set(proxy, [prop_map, redo, container]);	//	Register the object
		return proxy;
	}

	function cleanProxyMaps(){	//	Detect unused objects and windows and remove them so they can be garbage collected by the browser
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



	let windows = document.querySelectorAll(".window");	//	Register all windows defined in index.html
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}

	setInterval(cleanProxyMaps, 5000);	//	Set up the removal of unused windows

	const object_window_template = document.getElementById("object_window_template").content.children[0];	//	Initialize windows for all objects in the scene as well as the object manager window
	const draggables_container = document.getElementById("draggables_container");

	const manager_button_template = document.getElementById("object_window_button_template").content.children[0];
	let window_button_map = new Map();
	const object_window_manager = document.getElementById("object_windows");


	let object_window_map = new Map();
	let object_window_update_handler = ()=>{	//	Set up methods for detecting new objects being added to the scene and removing them from the scene
		let toChange = [];
		for(let i=0; i<_globalScene.children.length; i++){	//	Check for new objects
			let child = _globalScene.children[i];

			if(!object_window_map.has(child)){
				toChange.push(i);
			}
		}
		for(let index of toChange){	//	Set up new windows if needed
			let child = _globalScene.children[index];
			let window = object_window_template.cloneNode(true);
			let title = window.querySelector(".object_name");
			let window_button = manager_button_template.cloneNode(true);
			let button_title = window_button.querySelector(".object_name");
			let object_type_icon = "";


			let oc = window.querySelector(".object_children");

			if(!child.name){
				if(child instanceof LightSource3D){
					child.name = "Light "+(lightId++);
				}else{
					child.name = "Object "+(objId++);
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
			if(child instanceof Object3){
				propertyData.renderVisibility = { name: "visible"};
			}
			if(child instanceof LightSource3D){	//	Set up icons for objects and special rules for handling their properties if they have any which need extra support
				propertyData.lightColor = { min:0, max:1, step: 0.01, name: "light color"};
				propertyData.ambientInfluence = { min:0, max:1, step: 0.01, name: "ambient light influence"};
				propertyData.specularInfluence = { min:0, max:1, step: 0.01, name: "specular light influence"};
				propertyData.diffuseInfluence = { min:0, max:1, step: 0.01, name: "diffuse light influence"};
				object_type_icon = "\uD83D\uDCA1";
			}else if(child instanceof Mesh3d){
				object_type_icon = "\u25A6";
			}else if(child === Camera){
				object_type_icon = "\uD83D\uDCF7";
			}else if(child instanceof Object3){
				object_type_icon = "\u26BD";
			}else{
				object_type_icon = "\u2753";
			}

			let obj = generateDescriptor(child, oc, propertyData);	//	Render the object's properties
			_globalScene.children[index] = obj;

			draggables_container.appendChild(window);	//	Render object
			object_window_map.set(obj, window);

			window.querySelector(".delete_object_button").addEventListener("click", ()=>{	//	Set up the delete object button
				let index = _globalScene.children.indexOf(obj);
				if(index === -1) return;
				_globalScene.removeChild(obj);
				window.remove();
				window_button.remove();
			});
			window_button.addEventListener("click", ()=>{	//	If the window's corresponding button in the object manager has been pressed show it to the user
				window.showcaseWindow();
			});

			window_button_map.set(addWindow(window), window_button);
			window.managedObject3 = obj;
			window.querySelector(".object_type_icon").innerText = object_type_icon;
			window_button.querySelector(".object_type_icon").innerText = object_type_icon;


			if(windowAutoHide){	//	If auto hide is enabled start the window in the closed state
				window.hideWindow();
			}
			object_window_manager.appendChild(window_button);
		}

		toChange.length = 0;	//	Set up the removal of unused windows

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
	_globalScene.children.push(Camera);		//	The camera object is not a normal object and cannot be removed, however it should be processed by the window system as if it was one. Since its not a part of the scene trying to remove it from the scene would crash the program. For this reason we add it to the scene for the initialization and remove it as soon as we are done setting everything up
	object_window_update_handler();
	Camera = _globalScene.children.pop();

	let cam_window = object_window_map.get(Camera);	//	Remove the delete object button from the camera window
	cam_window.querySelector(".delete_object_button").remove();

	setInterval(object_window_update_handler, 250);		//	Remove windows and objects which are not getting rendered anymore from the system to save memory and cpu usage. Perform this cleanup every 250 milliseconds

