function addWindow(elem){
	let header = elem.querySelector(".header");

	let mouseX, mouseY;
	let moved = 0;

	function onClick(e){
		elem.classList.toggle("window-minimized");
	}

	function onDragStart(e){
		document.onmousemove = onDrag;
		document.onmouseup = onDragEnd;

		mouseX = e.clientX;
		mouseY = e.clientY;
		e.preventDefault();
		moved = 0;
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
		if(moved === 0){
			onClick(e);
		}
	}
	header.onmousedown = onDragStart;
}

{	//	New scope because these are only needed for initialization
	let windows = document.querySelectorAll(".window");
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}
}