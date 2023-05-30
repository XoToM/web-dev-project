
function genHexPalette(num,size){	//	Pre-generate the strings needed to display the data as we are going to be using a lot of them.
	let palette = [];
	for(let i = 0; i < num; i++){
		palette.push(i.toString(16).padStart(size,'0').toUpperCase());
	}
	return palette;
}

const HEX_PALETTE = genHexPalette(256, 2);	//	Generate the strings

function loadHex(hex_id, data, defaultAddrPadding){		//	Function for generating a hex viewer object. First argument is the id of the DOM element which will become the hex viewer, second is the data we want to display, and third is the amount of digits we want the addresses to have
	let grid = document.getElementById(hex_id);		//	Get the DOM element
	const inp_template = document.getElementById("hex_input_template").content.children[0];
	let hex = {};
	let autoPadding = !defaultAddrPadding;
	let last_input = null;
	let last_text = null;
	if(!autoPadding) defaultAddrPadding--;

	data.hex = hex;		//	Store the data for later
	hex.grid = grid;
	hex.data = data;
	hex.changes = [];
	hex.highlights = [];	//	Stores information about which bytes should have a highlight applied to them

	function whichChild(elem){
		var  i= 0;
		while((elem=elem.previousSibling)!=null) ++i;
		return i;
	}

	if(grid.childNodes.length==0){	//	Check if the hex viewer element already has any child elements, and if it does use them instead of generating new ones. This could be used for custom styling
		hex.labels = document.createElement("DIV");	//	Create needed elements
		hex.top_labels = document.createElement("DIV");
		hex.values = document.createElement("DIV");
		hex.padding = document.createElement("DIV");

		hex.top_labels.classList.add("top-labels");	//	Apply default styles to the elements
		hex.labels.classList.add("labels");
		hex.values.classList.add("data");
		hex.padding.classList.add("padding");

		grid.appendChild(hex.padding);	//	Add the elements to the hex viewer element
		grid.appendChild(hex.top_labels);
		for(let i = 0; i < 16; i++){	//	Generate the labels displayed at the top
			let elem = document.createElement("SPAN");
			elem.innerText = i.toString(16).toUpperCase();
			hex.top_labels.appendChild(elem);
		}
		grid.appendChild(hex.labels);
		grid.appendChild(hex.values);

	}else{
		hex.labels = grid.querySelector(".labels");	//	Store references to the needed elements
		hex.top_labels = grid.querySelector(".top-labels");
		hex.values = grid.querySelector(".data");

		for(let i = 0; i < 16; i++){	//	Generate the labels displayed at the top
			let elem = document.createElement("SPAN");
			elem.innerText = i.toString(16).toUpperCase();
			hex.top_labels.appendChild(elem);
		}
	}

	hex.set = function(obj, prop, val){	//	Generate an event handler for when a piece of data gets changed.
		if(!isNaN(prop)){	//	Detect if a data value has changed
			if(hex.changes.length == 0) setTimeout(hex.render, 5);	//	Tell the hex viewer that there have been changes and that it needs to update the DOM

			val = Math.floor(Math.min(255, Math.max(0, val)));	//	Make sure the new value is a byte

			hex.changes.push(+prop);	//	Store which element got changed

		}else if(prop == "length"){
			if(hex.changes.length == 0) setTimeout(hex.render, 5);	//	Tell the hex viewer that there have been changes and that it needs to update the DOM
			hex.changes.push(0);	//	Store a command for rerendering everything
		}
		data[prop] = val;	//	Update the property
		return true;
	};
	hex.recalculatePadding = ()=>{	//	Calculate the needed amount of padding. Does not update padding on existing labels automatically
		let addrLength = Math.ceil(data.length/16);
		let counter = 0;
		let decrementer = addrLength;
		while(decrementer>1){
			decrementer /= 16;
			counter++;
		}
		defaultAddrPadding = counter;
	};
	hex.closeInput = ()=>{	//	Close text inputs if there are any
		if(last_input){
			let index = whichChild(last_input);
			let span = last_text || document.createElement("SPAN");
			try{
				let data = last_input.querySelector("input").value;
				data = parseInt(data, 16);
				if(Number.isNaN(data)) data = parseInt(last_text.innerText, 16);
				let value = Math.max(0,Math.min(255, Math.round(data)));
				hex.proxy[index] = value;
				span.innerText = HEX_PALETTE[value];
			}catch(e){
				span.innerText = HEX_PALETTE[hex.proxy[index]];
			}
				span.ondblclick = hex.onEditor;
				last_input.replaceWith(span);
				last_input = null;
				last_text = null;
		}
	};
	hex.onEditor = (event)=>{	//	Open a text input
		hex.closeInput();
		let index = whichChild(event.target);
		let hexin = inp_template.cloneNode(true);
		let input = hexin.querySelector("input");
		input.value = "";	//	HEX_PALETTE[hex.data[index]];
		input.onblur = ()=>{hex.closeInput();}
		last_text = event.target;
		event.target.replaceWith(hexin);
		last_input = hexin;
		input.focus();
	};

	hex.render = function() {	//	The hex viewer rendering function
		let values = hex.values;	//	Initialize variables and shorthands for existing objects
		let labels = hex.labels;
		let redo_full = false;
		let data = hex.data;
		let changes = hex.changes;

		if(data.length > values.childNodes.length){	//	Detect if the length of the data array has increased, and add extra elements if so
			let count = data.length - values.childNodes.length;
			for(let i = 0; i < count; i++){
				let span = document.createElement("SPAN");
				span.ondblclick = hex.onEditor;
				span.onclick = hex.closeInput;
				values.appendChild(span);
			}
			redo_full = true;	//	The amount of DOM elements changed, meaning that we are going to need to redraw everything
		}
		if(data.length < values.childNodes.length){	//	Detect if the length of the data array has decreased, and remove unnecessary elements if so
			let count = values.childNodes.length - data.length;
			for(let i = 0; i < count; i++){
				values.removeChild(values.childNodes[values.childNodes.length - 1]);
			}
			redo_full = true;	//	The amount of DOM elements changed, meaning that we are going to need to redraw everything
		}

		let addrLength = Math.ceil(data.length/16);	//	Calculate the needed amount of address labels
		let redo_labels = false;
		if(autoPadding && addrLength !== labels.childNodes.length) redo_labels = true;	//	If the amount of address labels has changed and we have auto padding enabled we should change up the labels

		if(addrLength > labels.childNodes.length){	//	If the amount of address labels has increased add more address labels
			let count = addrLength - labels.childNodes.length;
			for(let i = 0; i < count; i++){
				labels.appendChild(document.createElement("SPAN"));
			}
		}
		if(addrLength < labels.childNodes.length){	//	If the amount of address labels has decreased remove the unnecessary labels
			let count = labels.childNodes.length - addrLength;
			for(let i = 0; i < count; i++){
				let n = labels.childNodes[labels.childNodes.length - 1];
				labels.removeChild(n);
			}
		}

		if(redo_full || redo_labels){	//	Update the address labels
			if(autoPadding) hex.recalculatePadding();
			for(let i = 0; i < labels.childNodes.length; i++){
				let new_label = "0x" + i.toString(16).padStart(defaultAddrPadding, '0').toUpperCase();
				labels.childNodes[i].innerText = new_label;
			}
		}

		if(redo_full){
			changes = [];	//	If a full redraw is needed update all DOM elements which represent data
			hex.changes = changes;
			for(let i = 0; i < data.length; i++){
				values.childNodes[i].innerText = HEX_PALETTE[data[i]];
			}
		}else{
			while(changes.length > 0){	//	If only incremental changes are needed update the changed cells
				let addr = changes.pop();
				values.childNodes[addr].innerText = HEX_PALETTE[data[addr]];
			}
		}
	};

	function applyHighlight(highlight){	//	Internal function for applying highlights to data cells
		let [start, count, style] = highlight;

		for(let i = start; i < Math.min(start + count, hex.values.childNodes.length); i++){	//	Applies the given class to the selected data cells
			hex.values.childNodes[i].classList.add(style);
		}
	}

	function removeHighlightCell(address, style){	//	Internal function for removing highlights from data cells
		let toAppend = [];
		let toRemove = [];
		for(let i = 0; i < hex.highlights.length; i++){	//	Remove css classes responsible for data highlighting. If the indicated cell is inside multiple highlight regions only remove the given class. Make sure that reomving highlights from cells which are in the middle of a highlight region splits the region in two
			let highlight = hex.highlights[i];
			if(highlight[0] > address || highlight[0] + highlight[1] < address && style == highlight[2]) continue;

			let [start, count, s] = highlight;
			let index = address-start;

			highlight[1] = index;

			let rest = [address + 1, count- index - 1, style];
			if(rest[1] > 0) toAppend.push(rest);

			if(highlight[1] == 0){
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

	data.highlight = function(index, count, style){	//	Apply highlight to the indicated data cells. style is the name of the css class to apply
		if(typeof count == "string"){
			style = count;
			count = 1;
		}
		let h = [index, count, style];
		hex.highlights.push(h);
		applyHighlight(h);
	};
	data.unhighlight = function(index, count, style){	//	Remove highlight from the indicated data cells
		if(typeof count == "string"){
			style = count;
			count = 1;
		}
		for(let i = index; i < index + count; i++){
			removeHighlightCell(i, style);
		}
	}

	let proxy = new Proxy(data, hex);	//	Generate a proxy object to detect changes to the data. This basically lets the hex viewer object work as an Array which also updates the UI.
	hex.proxy = proxy;

	hex.render();	//	Render the initial data
	return proxy;
}
