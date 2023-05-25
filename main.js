let hex;

{
	let data = [];
	for(let i=0;i<2560;i++){
		data.push(i%256);
	}
	hex = loadHex("memory", data, 4);
}

function onFileHover(event){
	event.preventDefault();
}
function onDragStart(event){
	if(event.dataTransfer.items.length && event.dataTransfer.items[0].kind === "file"){
		document.getElementById("drag_overlay").style.opacity = 100;
		document.getElementById("drag_overlay").style.zIndex = 100;
	}
}
function onDragEnd(event){
	document.getElementById("drag_overlay").style.opacity = 0;
	document.getElementById("drag_overlay").style.zIndex = -100;
}

//	Fetch and load file from path
async function loadHexFile(path){
	let response = await fetch(path);
	let buffer = await response.arrayBuffer;
	await loadBuffer(buffer);
}

//	Load dropped file
async function loadFile(event){
	console.log("File(s) dropped");
	event.preventDefault();

	if(event.dataTransfer.files && event.dataTransfer.files.length){
		let file = event.dataTransfer.files[0];
		let ab = await file.arrayBuffer();
		await loadBuffer(ab);
		//

		//hex = loadHex("memory", data, 4);
	}
}

//Load file from buffer
async function loadBuffer(data){
	hex.length = 0;
	data = new Uint8Array(data);

	for(let i=0; i<data.length; i++){
		hex.push((+data[i])&0b11111111);
	}
}
