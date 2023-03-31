function genHexPalette(num,size){
	let palette = [];
	for(let i=0;i<num;i++){
		palette.push(i.toString(16).padStart(size,'0').toUpperCase());
	}
	return palette;
}
const HEX_PALETTE = genHexPalette(256, 2);

function loadHex(hex_id, data, defaultAddrPadding){
	let grid = document.getElementById(hex_id);
	let hex = {};

	data.hex = hex;
	hex.grid = grid;
	hex.data = data;
	hex.changes = [];


	for (let i = 0; i < grid.childNodes.length; i++) {
		if (grid.childNodes[i].className == "labels") {
		  hex.labels = grid.childNodes[i];
		  break;
		}        
	}

	for (let i = 0; i < grid.childNodes.length; i++) {
		if (grid.childNodes[i].className == "top-labels") {
		  hex.top_labels = grid.childNodes[i];
		  break;
		}        
	}

	for(let i = 0; i < 16;i++){
		let elem = document.createElement("SPAN");
		elem.innerText = i.toString(16).toUpperCase();
		hex.top_labels.appendChild(elem);
	}

	for (let i = 0; i < grid.childNodes.length; i++) {
		if (grid.childNodes[i].className == "data") {
		  hex.values = grid.childNodes[i];
		  break;
		}        
	}

	hex.set = function(obj, prop, val){
		if(!isNaN(prop)){
			//let hex = obj.hex;
			if(hex.changes.length==0) setTimeout(hex.render, 5);
	
			val = Math.floor(Math.min(255, Math.max(0, val)));

			hex.changes.push(+prop);

		}
		data[prop] = val;
		return true;
	};

	hex.render = function() {
		//let hex = obj.hex;
		let values = hex.values;
		let labels = hex.labels;
		let redo_full = false;
		let data = hex.data;
		let changes = hex.changes;

		if(data.length > values.childNodes.length){
			let count = data.length - values.childNodes.length;
			for(let i = 0; i < count; i++){
				values.appendChild(document.createElement("SPAN"));
			}
			redo_full = true;
		}
		if(data.length < values.childNodes.length){
			let count = data.length - values.childNodes.length;
			for(let i = 0; i < count; i++){
				values.removeChild(values.childNodes[values.childNodes.length - 1]);
			}
			redo_full = true;
		}

		let addrLength = Math.ceil(data.length/16);

		if(addrLength > labels.childNodes.length){
			let count = addrLength - labels.childNodes.length;
			for(let i = 0; i < count; i++){
				labels.appendChild(document.createElement("SPAN"));
			}
			for(let i = 0; i < labels.childNodes.length; i++){
				labels.childNodes[i].innerText = "0x" + i.toString(16).padStart(defaultAddrPadding - 1, '0').toUpperCase();
			}
		}
		if(addrLength < labels.childNodes.length){
			let count = addrLength - labels.childNodes.length;
			for(let i = 0; i < count; i++){
				let n = labels.childNodes[labels.childNodes.length - 1];
				labels.removeChild(n);
			}
		}

		if(redo_full){
			changes = [];
			hex.changes = changes;
			for(let i = 0; i < data.length; i++){
				values.childNodes[i].innerText = HEX_PALETTE[data[i]];
			}
		}else{
			while(changes.length > 0){
				let addr = changes.pop();
				values.childNodes[addr].innerText = HEX_PALETTE[data[addr]];
			}
		}
	};

	let proxy = new Proxy(data, hex);
	hex.proxy = proxy;

	hex.render();
	return proxy;
}
let hex;
window.addEventListener('load', ()=>{
	let data = [];
	for(let i=0;i<256;i++){
		data.push(i);
	}
	hex = loadHex("memory", data, 4);
});