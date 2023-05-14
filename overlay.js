function addWindow(elem){
	let header = elem.querySelector(".header");

	let mouseX, mouseY;

	function onDragStart(e){
		document.onmousemove = onDrag;
		document.onmouseup = onDragEnd;

		mouseX = e.clientX;
		mouseY = e.clientY;
		e.preventDefault();
	}
	function onDrag(e){
		elem.style.top = (elem.offsetTop + (e.clientY - mouseY)) + "px";
		elem.style.left = (elem.offsetLeft + (e.clientX - mouseX)) + "px";
		mouseX = e.clientX;
		mouseY = e.clientY;
		e.preventDefault();
	}
	function onDragEnd(e){
		document.onmouseup = null;
		document.onmousemove = null;
	}
	header.onmousedown = onDragStart;
}

{	//	New scope because these are only needed for initialization
	let windows = document.querySelectorAll(".window");
	for(let i=0; i<windows.length; i++){
		addWindow(windows[i]);
	}
}