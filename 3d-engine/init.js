const canvas = document.getElementById("canvasgl");


const m4 = twgl.m4;
let gl = canvas.getContext("webgl2", {antialias:false});
//	Get a WebGL 2 context. WebGL 1 is very limited, and most devices support it by now anyway
	//	Both Chrome and Firefox seem to get better results with antialiasing disabled. When its enabled there might be some gaps between faces

if(!gl){	//	Display a message to the user if they can't run this project
	alert("WebGl 2 is not supported in your browser, which means you cannot open this page properly. This page will now close.");
	window.stop();
	window.close();
}

var getFileAsync = function(url) {	//	Load files asynchronously
	var req = new XMLHttpRequest();
	let promise = new Promise((resolve, reject)=>{
		req.open("GET", url, true);
		req.onload = (d)=>{
			let result = (d.target.status == 200) ? d.target.responseText : null;
			//console.log(d,d.target.status,d.target.responseText, result);
			resolve(result);
		};
		req.onerror = (e)=>{console.error(e);reject();};
		req.send(null);
	});
	return promise;
};

new AssetManager(gl);
_globalScene = _assetManager.correctObject(_globalScene);



let waiting = true;

let Camera = {position:new Float32Array([0,0,-5]), rotation:new Float32Array([0,0,0]), renderDistance:200};	//	Set up the camera object

gl.enable(gl.DEPTH_TEST);


let _LastRenderTime = 0;

function _render(time) {	//	Set up the rendering loop
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	let deltaTime = (time - _LastRenderTime)/1000;

	if(typeof(render) != "undefined"){
		render(deltaTime);
	}


	let cameraMatrix = m4.identity();
	let projectionMatrix = m4.identity();
	m4.identity(cameraMatrix);
	m4.perspective(40 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, +(0.01), Camera.renderDistance, projectionMatrix);
	m4.rotateX(cameraMatrix, Camera.rotation[0] * (Math.PI/180), cameraMatrix);
	m4.rotateY(cameraMatrix, Camera.rotation[1] * (Math.PI/180), cameraMatrix);
	m4.rotateZ(cameraMatrix, Camera.rotation[2] * (Math.PI/180), cameraMatrix);
	m4.translate(cameraMatrix, [-Camera.position[0], -Camera.position[1], Camera.position[2]], cameraMatrix);

	const standardUniforms = {
		u_resolution: [gl.canvas.width, gl.canvas.height],
		u_renderSettings: (!Camera.specularEnable) * 4 + (!Camera.ambientEnable) + (!Camera.diffuseEnable)*2,
		u_projectionMatrix: projectionMatrix,
		u_cameraPosition: v3.create(Camera.position[0], Camera.position[1], -Camera.position[2]),

		u_shininess: 32,
	};

	__ANIMATION_PLAYERS.forEach((ap)=>ap.stepAnimations(deltaTime));

	performRender(cameraMatrix, v3.copy(Camera.position), standardUniforms);

	_LastRenderTime = time;
	requestAnimationFrame(_render);
}
requestAnimationFrame(_render);