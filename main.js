let hex;
let current_drag_object = null;
const drag_overlay = document.getElementById("drag-overlay");

{		//	Initialization code which makes the hex viewer display increasing bytes
	let data = [];	//	Generate bytes
	for(let i=0;i<256;i++){
		data.push(i%256);
	}

	hex = loadHex("memory", data, 4);	//	Initialize the hex viewer with data
}

function onFileHover(event){	//	Prevent the browser from messing with our dragging behaviour
	event.preventDefault();
}

function onDragStart(event){
	if(event.dataTransfer.items.length && event.dataTransfer.items[0].kind === "file"){	//	Only handle this event if the user is dragging a file
		current_drag_object = event.target;

		drag_overlay.style.opacity = 100;	//	Show the file drop overlay
		drag_overlay.style.zIndex = 100;
	}
}
function onDragEnd(event){
	if(event && current_drag_object !== event.target) return;	//	Check if the element the user is hovering over has changed or if the user left the page. Ignore the event if the user is simply hovering over a different element
	drag_overlay.style.opacity = 0;	//	Hide the file drop overlay
	drag_overlay.style.zIndex = -100;
}

async function onFileInputChange(event){
	if(event.target.files && event.target.files.length){	//	Check if there are any files to be loaded
		let file = event.target.files[0];	//	Get the first file
		let ab = await file.arrayBuffer();
		await loadBuffer(ab);				//	Load the file
	}
}

//	Fetch and load file from path
async function loadHexFile(path){
	let response = await fetch(path);
	let buffer = await response.arrayBuffer;
	await loadBuffer(buffer);
}

//	Load dropped file
async function loadFile(event){
	event.preventDefault();		//	Prevent the browser from opening the file in this browser tab. This would close the page which we dont want

	if(event.dataTransfer.files && event.dataTransfer.files.length){	//	Check if there are any files to be loaded
		let file = event.dataTransfer.files[0];	//	Get the first file
		let ab = await file.arrayBuffer();
		await loadBuffer(ab);				//	Load the file
	}
}

//Load file from buffer
async function loadBuffer(data){
	data = new Uint8Array(data);	//	Get the raw bytes

	hex.length = 0;	//	Clear all bytes in the hex viewer

	for(let i=0; i<data.length; i++){	//	Load all bytes into the hex viewer
		hex.push(data[i]);
	}
}