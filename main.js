let hex;
let current_drag_object = null;
const drag_overlay = document.getElementById("drag-overlay");
const example_selector = document.getElementById("example-selection");

{		//	Initialization code which makes the hex viewer display increasing bytes
	let data = [];	//	Generate bytes
	for(let i=0;i<256;i++){
		data.push(i%256);
	}

	hex = loadHex("memory", data);	//	Initialize the hex viewer with data
	example_selector.selectedIndex = 1;	//	Some browsers like to save settings between reloads, but this sample data gets loaded immediately. This means that I have to reset the selected option in the dropdown manualy every time the page loads
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

async function onFileInputChange(event){	//	On File loaded through button
	if(event.target.files && event.target.files.length){	//	Check if there are any files to be loaded
		let file = event.target.files[0];	//	Get the first file
		let ab = await file.arrayBuffer();
		example_selector.selectedIndex = 0;
		await loadBuffer(ab);				//	Load the file
	}
}
async function onExampleSelected(event){
	switch(event.target.selectedIndex){	//	Do a different thing depending on what is selected in the dropdown
		case 1:
			hex.length = 0;
			for(let i=0;i<256;i++){
				hex.push(i%256);
			}
			break;
		case 2:
			await loadHexFile("./examples/test.nbt");
			break;
		case 3:
			await loadHexFile("./index.html");
			break;
		case 4:
			await loadHexFile("./styles.css");
			break;
		case 5:
			await loadHexFile("./main.js");
			break;
		case 6:
			await loadHexFile("./hexedit.js");
			break;
	}
}

//	Fetch and load file from path
async function loadHexFile(path){
	let response = await fetch(path);
	let buffer = await response.arrayBuffer();
	await loadBuffer(buffer);
}

//	Load dropped file
async function loadFile(event){
	event.preventDefault();		//	Prevent the browser from opening the file in this browser tab. This would close the page which we dont want
	example_selector.selectedIndex = 0;

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