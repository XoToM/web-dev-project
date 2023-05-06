const canvas = document.getElementById("canvasgl");


const m4 = twgl.m4;
function logGLCall(functionName, args) {
	//console.log("gl." + functionName + "(" + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");	//	Log WebGL calls
}
let gl = canvas.getContext("webgl2");
//let gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl2"), undefined, logGLCall);	//	Get a WebGL 2 context. WebGL 1 is very limited, and most devices support it by now anyway


var getFileSync = function(url) {
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
	return (req.status == 200) ? req.responseText : null;
};

new AssetManager(gl);



let waiting = true;

let Camera = {position:[0,5,-5], rotation:[0,0,0], renderDistance:200, specularEnable:true, ambientEnable:true, diffuseEnable:true};

gl.enable(gl.DEPTH_TEST);


let _LastRenderTime = 0;

function _render(time) {
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	let deltaTime = (time - _LastRenderTime)/100;

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
	//m4.scale(cameraMatrix, [1,1,camera.renderDistance], cameraMatrix);

	const standardUniforms = {
		resolution: [gl.canvas.width, gl.canvas.height],
		u_ambientLight: [1,1,1,0.2],
		u_lightPosition: [5, 4, 4],
		u_lightColor: [1, 1, 1],
		u_specularStrength: 1,
		u_shininess: 32,
		u_renderSettings: Camera.specularEnable * 4 + Camera.ambientEnable + Camera.diffuseEnable*2,
		u_projectionMatrix: projectionMatrix,
		u_cameraPosition: v3.create(Camera.position[0], Camera.position[1], -Camera.position[2])
	};

	performRender(cameraMatrix, standardUniforms);

	_LastRenderTime = time;
	requestAnimationFrame(_render);
}
requestAnimationFrame(_render);