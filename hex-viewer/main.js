let hex;
let lastFileName = "hex file.bin";
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
		lastFileName = file.name.split(/(\\|\/)/g).pop();
		let ab = await file.arrayBuffer();
		example_selector.selectedIndex = 0;
		await loadBuffer(ab);				//	Load the file
	}
}
async function onExampleSelected(event){
	hex.unhighlight(0, hex.length);
	lastFileName = "hex file.bin";
	switch(event.target.selectedIndex){	//	Do a different thing depending on what is selected in the dropdown
		case 1:	//	Generate 256 numbers
			hex.length = 0;
			for(let i=0;i<256;i++){
				hex.push(i%256);
			}
			break;
		case 2:	//	Generate 256 numbers
			hex.length = 0;
			for(let i=0;i<256;i++){
				hex.push(i%256);
				let isPrime = true;
				for(let n=2; n<128; n++){
					if(!(i%n) && i !== n){
						isPrime = false;
						break;
					}
				}
				if(isPrime) hex.highlight(i,1, "red-highlight");
			}
			break;
		case 3:	//	Generate 256 zeros. Bytes are changed elsewhere
			hex.length = 0;
			for(let i=0;i<256;i++){
				hex.push(0);
			}
			break;
		case 4:
			await loadHexFile("./examples/test.nbt");
			lastFileName = "test.nbt";
			break;
		case 5:
			await loadHexFile("./index.html");
			lastFileName = "index.html";
			break;
		case 6:
			await loadHexFile("./styles.css");
			lastFileName = "styles.css";
			break;
		case 7:
			await loadHexFile("./main.js");
			lastFileName = "main.js";
			break;
		case 8:
			await loadHexFile("./hexedit.js");
			lastFileName = "hexedit.js";
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
	hex.unhighlight(0, hex.length);

	if(event.dataTransfer.files && event.dataTransfer.files.length){	//	Check if there are any files to be loaded
		let file = event.dataTransfer.files[0];	//	Get the first file
		lastFileName = file.name.split(/(\\|\/)/g).pop();
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

{	//	Check if example nr 3 is selected, and if so, randomly change 1 byte every 500 ms
	const example_seletor = document.getElementById("example-selection");
	setInterval(()=>{
		if(example_selector.selectedIndex === 3){
			hex[Math.floor(Math.random() * hex.length)] = Math.floor(Math.random() * 256);
		}
	}, 500);
}
async function onFileDownload(){
	hex.hex.closeInput();
	let data = new Uint8Array(hex.hex.data.length);
	for(let i=0;i<data.length;i++){
		data[i] = hex[i];
	}
	let file = new File([data.buffer], lastFileName);
	let url = URL.createObjectURL(file)
	let a = document.createElement("a");
	a.href = url;
	a.download = lastFileName || 'download';

	const clickHandler = () => {
		setTimeout(() => {
		  URL.revokeObjectURL(url);
		  removeEventListener('click', clickHandler);
		}, 150);
	  };
	a.addEventListener("click", clickHandler,false);
	a.click();
}