const canvas = document.getElementById("canvasgl");

const m4 = twgl.m4;
function logGLCall(functionName, args) {
	//console.log("gl." + functionName + "(" + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ")");	//	Log WebGL calls
}
let gl = canvas.getContext("webgl2");
//let gl = WebGLDebugUtils.makeDebugContext(canvas.getContext("webgl2"), undefined, logGLCall);	//	Get a WebGL 2 context. WebGL 1 doesn't have 3d textures, and has many other limitations


var getFileSync = function(url) {
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
	return (req.status == 200) ? req.responseText : null;
};

new AssetManager(gl);

const programInfo = twgl.createProgramInfo(gl, [getFileSync("shaders/vert.glsl"), getFileSync("shaders/frag.glsl")]);

let asset = _assetManager.loadModel("tests/test1.gltf", "test1", programInfo.program);

let waiting = true;

let camera = {position:[0,0,0], rotation:[0,0], renderDistance:200};



function render(time) {
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

	let cameraMatrix = m4.identity();
	m4.perspective(30 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.5, camera.renderDistance, cameraMatrix);
	m4.translate(cameraMatrix, camera.position, cameraMatrix);
	m4.rotateZ(cameraMatrix, camera.rotation[1] * (Math.PI/180), cameraMatrix);
	m4.rotateX(cameraMatrix, camera.rotation[0] * (Math.PI/180), cameraMatrix);
	//m4.scale(cameraMatrix, [1,1,camera.renderDistance], cameraMatrix);

	const standardUniforms = {
		resolution: [gl.canvas.width, gl.canvas.height],
		cameraMatrix,
	};

	gl.useProgram(programInfo.program);
	twgl.setUniforms(programInfo, standardUniforms);

	//twgl.drawBufferInfo(gl, bufferInfo);

	requestAnimationFrame(render);
}
asset.then((a)=>{asset = a; requestAnimationFrame(render); console.log(asset);});
//requestAnimationFrame(render);