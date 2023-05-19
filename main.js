let hex;

{
	let data = [];
	for(let i=0;i<2560;i++){
		data.push(i%256);
	}
	hex = loadHex("memory", data, 4);
}

function loadFile(event){
	console.log("File(s) dropped");
	event.preventDefault();

	if(event.dataTransfer.items){
		for(let item of event.dataTransfer.items){
			console.log(item, item.kind);

			//	Breakpoint here to see the items contents
			
		}
		//hex = loadHex("memory", data, 4);
	}
}
function onFileHover(event){
	event.preventDefault();
}