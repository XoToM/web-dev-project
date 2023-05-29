const drag_overlay = document.getElementById("drag-overlay");
let current_drag_object = null;


function onFileHover(event){	//	Prevent the browser from messing with our dragging behaviour
	event.preventDefault();
}

function onFileDragStart(event){
	if(event.dataTransfer.items.length && event.dataTransfer.items[0].kind === "file"){	//	Only handle this event if the user is dragging a file
		current_drag_object = event.target;

		drag_overlay.style.opacity = 100;	//	Show the file drop overlay
		drag_overlay.style.zIndex = 100 + __focusCounter;
	}
}
function onFileDragEnd(event){
	if(event && current_drag_object !== event.target) return;	//	Check if the element the user is hovering over has changed or if the user left the page. Ignore the event if the user is simply hovering over a different element
	drag_overlay.style.opacity = 0;	//	Hide the file drop overlay
	drag_overlay.style.zIndex = -100;
}
let _loadedFiles = 0;
//	Load dropped file
async function loadModelFile(event){
	event.preventDefault();		//	Prevent the browser from opening the file in this browser tab. This would close the page which we dont want

	console.log(event, event.dataTransfer.files, event.dataTransfer.files.length);

	if(event.dataTransfer.files && event.dataTransfer.files.length){	//	Check if there are any files to be loaded
		let file = event.dataTransfer.files[0];	//	Get the first file
		let text = await file.text();

		try{
			let gltf = JSON.parse(text);
			let asset_name = "user_asset"+(_loadedFiles++);

			let model = await _assetManager.loadModel(
				gltf,
				asset_name,
				default_shader_program,
				{
					position: "a_position",
					normal: "a_normal",
					colorTexCoord: "a_colorTexCoord",
					colorSampler: "u_colorTexture",
				}
			);

			let obj = await model.generateObject3();	//	Give the point light a cube so it is easier to see where it is
			_globalScene.appendChild(obj);
		}catch(e){
			console.error("Error while loading file: ", e);
			alert("Could not load the given file (invalid file format?)")
		}
	}
}