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
	hex.highlights = [];

	if(grid.childNodes.length==0){
		hex.labels = document.createElement("DIV");
		hex.top_labels = document.createElement("DIV");
		hex.values = document.createElement("DIV");

		hex.top_labels.classList.add("top-labels");
		hex.labels.classList.add("labels");
		hex.values.classList.add("data");

		grid.appendChild(document.createElement("DIV"));
		grid.appendChild(hex.top_labels);
		for(let i = 0; i < 16; i++){
			let elem = document.createElement("SPAN");
			elem.innerText = i.toString(16).toUpperCase();
			hex.top_labels.appendChild(elem);
		}
		grid.appendChild(hex.labels);
		grid.appendChild(hex.values);
		
	}else{
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

		for(let i = 0; i < 16; i++){
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
	}

	hex.set = function(obj, prop, val){
		if(!isNaN(prop)){
			//let hex = obj.hex;
			if(hex.changes.length==0) setTimeout(hex.render, 5);
	
			val = Math.floor(Math.min(255, Math.max(0, val)));

			hex.changes.push(+prop);

		}else if(prop=="length"){
			if(hex.changes.length==0) setTimeout(hex.render, 5);
			hex.changes.push(0);
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
			let count = values.childNodes.length - data.length;
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
			let count = labels.childNodes.length - addrLength;
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

	function applyHighlight(highlight){
		let [start, count, style] = highlight;

		for(let i=start; i < Math.min(start + count, hex.values.childNodes.length); i++){
			hex.values.childNodes[i].classList.add(style);
		}
	}
	function removeHighlightCell(address, style){
		let toAppend = [];
		let toRemove = [];
		for(let i=0;i<hex.highlights.length;i++){
			let highlight = hex.highlights[i];
			if(highlight[0] > address || highlight[0]+highlight[1] < address && style==highlight[2]) continue;

			let [start, count, s] = highlight;
			let index = address-start;

			highlight[1] = index;

			let rest = [address + 1, count-index-1, style];
			if(rest[1] > 0) toAppend.push(rest);
			
			if(highlight[1]==0){
				toRemove.push(highlight);
			}
		}
		if(style){
			hex.values.childNodes[address].classList.remove(style);
		}else{
			hex.values.childNodes[address].classList = [];
		}
		hex.highlights = hex.highlights.filter((e)=>!toRemove.includes(e));
		for(let i = 0; i < toAppend.length; i++) hex.highlights.push(toAppend[i]);
	}

	data.highlight = function(start, count, style){
		if(typeof count=="string"){
			style = count;
			count = 1;
		}
		let h = [start, count, style];
		hex.highlights.push(h);
		applyHighlight(h);
	};
	data.unhighlight = function(start, count, style){
		if(typeof count == "string"){
			style = count;
			count = 1;
		}
		for(let i=start; i<start+count; i++){
			removeHighlightCell(i, style);
		}
	}

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