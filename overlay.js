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

	const default_object3_property_blacklist = new Set(["parent"]);
	const default_array_property_blacklist = new Set(["length"]);
	const empty_property_blacklist = new Set();

	let propertyNodeMap = new Map();
	let propertyHandlerMap = new Map();
	let nodeChangeListeners = new Map();
	let objGlobalMap = new Map();

	function createProxyDescriptor(obj, container, propertyBlacklist, onTitleChange, titleProperty, toAdd){
		propertyBlacklist =  propertyBlacklist || empty_property_blacklist;
		let obj_change_map = new Map(toAdd);
		let obj_handler;

		let node;
		let lobj = objGlobalMap.get(obj);
		if(lobj) {
			obj_handler = lobj[1];
		} else{
			obj_handler = {};
			obj = new Proxy(obj, obj_handler);
		}
		obj_handler.set = (o, name, val)=>{
			console.log(...arguments);
			o[name] = val;
			let changeHandler = obj_change_map.get(name);
			if(changeHandler) changeHandler(val);
			return true;
		};

		for(let [prop_name, prop_value] of Object.entries(obj)){
			if(prop_name.startsWith("_")) continue;
			if(propertyBlacklist.has(prop_name)) continue;

			switch(typeof(prop_value)){
				case "boolean":		//	The switch statement doesn't need curly brackets for its cases, but I'm using them here anyway to put different cases in separate scopes
					{
						node = single_descriptor_template.cloneNode(true);

						node.querySelector(".property_name").innerText = prop_name;
						let inp = node.querySelector("input");
						inp.type = "checkbox";

						let	listener = (event)=>{
							obj[prop_name] = event.target.checked;
						}

						nodeChangeListeners.set(inp, listener);
						inp.checked = prop_value;
						inp.addEventListener("change", listener, { passive:true });

						let handler = (val)=>{inp.checked = val;};
						obj_change_map.set(prop_name, handler);

						container.appendChild(node);
						break;
					}
				case "number":
					{
						node = single_descriptor_template.cloneNode(true);

						node.querySelector(".property_name").innerText = prop_name;
						let inp = node.querySelector("input");
						inp.type = "number";

						let	listener = (event)=>{
							obj[prop_name] = event.target.valueAsNumber;
						}
						if(onTitleChange && prop_name === titleProperty) {
							listener = (event)=>{
								obj[prop_name] = event.target.valueAsNumber;
								onTitleChange(event.target.valueAsNumber);
							};
						}

						nodeChangeListeners.set(inp, listener);
						inp.valueAsNumber = prop_value;
						inp.addEventListener("change", listener, { passive:true });

						let handler = (val)=>{
							inp.valueAsNumber = val;
						};
						if(onTitleChange && prop_name === titleProperty) {
							handler = (val)=>{
								inp.valueAsNumber = val;
								onTitleChange(val);
							};
						};
						obj_change_map.set(prop_name, handler);

						container.appendChild(node);
						break;
					}
				case "string":
					{
						node = single_descriptor_template.cloneNode(true);

						node.querySelector(".property_name").innerText = prop_name;
						let inp = node.querySelector("input");
						inp.type = "text";

						let	listener = (event)=>{
							obj[prop_name] = event.target.value;
						};
						if(onTitleChange && prop_name === titleProperty) {
							listener = (event)=>{
								obj[prop_name] = event.target.value;
								onTitleChange(event.target.value);
							};
						}

						nodeChangeListeners.set(inp, listener);
						inp.value = prop_value;
						inp.addEventListener("change", listener, { passive:true });

						let handler = (val)=>{
							inp.value = val;
						};
						if(onTitleChange && prop_name === titleProperty) {
							handler = (val)=>{
								inp.value = val;
								onTitleChange(val);
							};
						};
						obj_change_map.set(prop_name, handler);

						container.appendChild(node);
						break;
					}
				case "function":
					break;
				default:
					{
						if(!prop_value) break;
						if((prop_value instanceof Float32Array) && (prop_value.length <= 3)){
							node = propertyNodeMap.get(prop_value) || vector_descriptor_template.cloneNode(true);

							node.querySelector(".property_name").innerText = prop_name;
							let values = node.querySelectorAll("input");


							for(let i=0; i<3; i++){
								let listener = nodeChangeListeners.get(values[i]);
								if(listener){
									values[i].removeEventListener("change", listener);
								}
								listener = (event)=>{
									prop_value[i] = event.target.valueAsNumber;
								}
								nodeChangeListeners.set(values[i], listener);
								values[i].valueAsNumber = prop_value[i];
								values[i].addEventListener("change", listener, { passive:true });
							}

							let handler = propertyHandlerMap.get(node);
							if(!handler){
								handler = {set:(o,name,val)=>{
									if(!Number.isNaN(+name)) {
										if(Number.isNaN(val)) return false;
										values[name].valueAsNumber = val;
									}
									o[name] = val;
									return true;
								}};
								let proxy = new Proxy(prop_value, handler);
								obj[prop_name] = proxy;
								prop_value = proxy;
								propertyHandlerMap.set(node, handler);
							}
							//	ToDo: Add a handler for detecting when the entire vector object gets replaced

							propertyNodeMap.set(prop_value, node);
							container.appendChild(node);
							break;
						}
						break;
						if(prop_value instanceof Array)
						{
							node = propertyNodeMap.get(prop_value) || array_property_descriptor_template.cloneNode(true);
							container.appendChild(node);

							node.querySelector(".property_name").innerText = prop_name;
							let array_length_node = node.querySelector(".array_length");
							let object_properties = node.querySelector(".object_properties");
							array_length_node.innerText = prop_value.length;

							let update = ()=>{
								array_length_node.innerText = prop_value.length;
								while(object_properties.firstChild){
									object_properties.removeChild(object_properties.lastChild);
								}
								prop_value = createProxyDescriptor(prop_value, object_properties, default_array_property_blacklist, update, "length", [["length", update]]);
								obj[prop_name] = prop_value;
								propertyNodeMap.set(prop_value, node);
							};

							prop_value = createProxyDescriptor(prop_value, object_properties, default_array_property_blacklist, update, "length", [["length", update]]);
							
							obj[prop_name] = prop_value;

							let handler = (val)=>{
								update();
								//array_length_node.innerText = val;
								//while(object_properties.firstChild){
								//	object_properties.removeChild(object_properties.lastChild);
								//}
								//val = createProxyDescriptor(val, object_properties, default_array_property_blacklist, updateTitle, "length", [["length", updateTitle]]);
								//obj[prop_name] = val;
								//propertyNodeMap.set(val, node);
							};
							obj_change_map.set(prop_name, handler);

							propertyNodeMap.set(prop_value, node);
							break;
						}
						//if(prop_value instanceof Object3)
						{
							node = propertyNodeMap.get(prop_value) || object_property_descriptor_template.cloneNode(true);

							node.querySelector(".property_name").innerText = prop_name;
							let object_name_node = node.querySelector(".object_name");
							let object_properties = node.querySelector(".object_properties");
							if(!prop_value.name) prop_value.name = "Object " + (objId++);
							object_name_node.innerText = prop_value.name;

							prop_value = createProxyDescriptor(prop_value, object_properties, default_object3_property_blacklist, (val)=>{ object_name_node.innerText = val; }, "name");

							let handler = (val)=>{
								while(object_properties.firstChild){
									object_properties.removeChild(object_properties.lastChild);
								}
								val = createProxyDescriptor(val, object_properties, default_object3_property_blacklist, (val)=>{ object_name_node.innerText = val; }, "name");
								obj[prop_name] = val;
								propertyNodeMap.set(val, node);
							};
							obj_change_map.set(prop_name, handler);

							propertyNodeMap.set(prop_value, node);
							container.appendChild(node);
							break;
						}
						break;
					}
			}
		}
		objGlobalMap.set(obj, [node, obj_handler]);
		return obj;
	}
	function cleanProxyMaps(){
		let toClean = [];
		for(let [proxy, node] of propertyNodeMap.entries()){
			if(!document.contains(node)){
				toClean.push(proxy);
				propertyHandlerMap.get(node).set = undefined;
				propertyHandlerMap.delete(node);
			}
		}
		while(toClean.length){
			let proxy = toClean.pop();
			propertyNodeMap.delete(proxy);
		}

		for(let node of nodeChangeListeners.keys()){
			if(!document.contains(node)) toClean.push(node);
		}
		while(toClean.length){
			let node = toClean.pop();
			nodeChangeListeners.delete(node);
		}
	}

	let windows = document.querySelectorAll(".window");
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}

	setInterval(cleanProxyMaps, 5000);

	let oc = document.getElementById("object_children");
	_globalScene.name = "Scene Parent";
	_globalScene = createProxyDescriptor(_globalScene, oc);
	//oc.appendChild(createObject3Descriptor(_globalScene));
