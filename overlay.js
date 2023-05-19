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

	let proxy_map = new Map();

	function generateDescriptor(obj, container){	//	Assumes container is controlled by this function alone
		let proxy, prop_map, redo;
		let proxy_data = proxy_map.get(obj);
		if(proxy_data){
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
							node.querySelector(".property_name").innerText = prop_name;
							inp.type = "number";
							onUpdate = ()=>{
								inp.valueAsNumber = +obj[prop_name];
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.valueAsNumber;
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "string":
						{
							node = single_descriptor_template.cloneNode(true);
							let inp = node.querySelector("input");
							node.querySelector(".property_name").innerText = prop_name;
							inp.type = "text";
							onUpdate = ()=>{
								inp.value = obj[prop_name];
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.value;
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "boolean":
						{
							node = single_descriptor_template.cloneNode(true);
							let inp = node.querySelector("input");
							node.querySelector(".property_name").innerText = prop_name;
							inp.type = "checkbox";
							onUpdate = ()=>{
								inp.checked = obj[prop_name];
							};
							let changeListener = (event)=>{
								obj[prop_name] = event.target.checked;
							};
							inp.addEventListener("change", changeListener, { passive:true });
						}
						break;
					case "function":
						skip = true;
						break;
					default:
						if(prop_value instanceof Float32Array && prop_value.length === 3){
							onUpdate = ()=>{
								let lastNode = node;
								node = vector_descriptor_template.cloneNode(true);
								let inputs = node.querySelectorAll("input");
								node.querySelector(".property_name").innerText = prop_name;

								inputs[0].valueAsNumber = +obj[prop_name][0];
								inputs[1].valueAsNumber = +obj[prop_name][1];
								inputs[2].valueAsNumber = +obj[prop_name][2];

								let vector_proxy = new Proxy(obj[prop_name], {
									set: (o,n,v) => {
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
									}
								});
								
								for(let i=0; i<3; i++){
									let inp = inputs[i];
									let changeListener = (event)=>{
										let val = event.target.valueAsNumber;
										if(!Number.isNaN(val)) obj[prop_name][i] = val;
									};
									inp.addEventListener("change", changeListener, { passive:true });
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
			generateDescriptor(proxy, container);
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

	let oc = document.getElementById("object_children");
	_globalScene.name = "Scene Parent";
	_globalScene = generateDescriptor(_globalScene, oc);
	let abc = {a:1, b:"lol", c:true};
	//abc = generateDescriptor(abc, oc);

	//oc.appendChild(createObject3Descriptor(_globalScene));
