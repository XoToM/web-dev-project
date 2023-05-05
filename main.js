const canvas = document.getElementById("canvasgl");
const [posx,posy,posz, rotx,roty,rotz] = [document.getElementById("posx"),document.getElementById("posy"),document.getElementById("posz"),document.getElementById("rotx"),document.getElementById("roty"),document.getElementById("rotz")];

let MOUSE_SENSITIVITY = 15;
let CAMERA_MOVEMENT_SPEED = 0.5;

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

let asset = _assetManager.loadModel(
	"tests/default_cube.gltf",
	"cube",
	programInfo,
	{
		position: "a_position",
		colorTexCoord: "a_colorTexCoord",
		colorSampler: "u_colorTexture",
	});

let waiting = true;

let camera = {position:[0,0,-5], rotation:[0,0,0], renderDistance:200};

gl.enable(gl.DEPTH_TEST);

canvas.addEventListener("click", async () => {
	if (!document.pointerLockElement) {
		 canvas.requestPointerLock({
			unadjustedMovement: true,
		});
	}else{
		console.log("Click!");
	}
});
function _onMouseMove(e){
	camera.rotation[1] = (camera.rotation[1] + (e.movementX/MOUSE_SENSITIVITY))%360;
	camera.rotation[0] = Math.max(Math.min(camera.rotation[0] + (e.movementY/MOUSE_SENSITIVITY), 90), -90);
}
document.addEventListener("pointerlockchange", ()=>{
	
	if (document.pointerLockElement === canvas) {
		document.addEventListener("mousemove", _onMouseMove, false);
	} else {
		document.removeEventListener("mousemove", _onMouseMove, false);
	}
}, false);
let _KeyboardStatus = {};
document.addEventListener("keydown", (e)=>{
	_KeyboardStatus[e.code] = true;
	//console.log(e.code);
	e.preventDefault();
});
document.addEventListener("keyup", (e)=>{
	_KeyboardStatus[e.code] = false;
	e.preventDefault();
});
let _LastRenderTime = 0;

function render(time) {
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
	let deltaTime = (time - _LastRenderTime)/100;

	let cameraMovement = v3.create(0,0,0);					//	Simple Noclip Camera
	if (document.pointerLockElement === canvas){
		if(_KeyboardStatus.KeyW) {
			cameraMovement[2] += CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.KeyS) {
			cameraMovement[2] -= CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.KeyD) {
			cameraMovement[0] += CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.KeyA) {
			cameraMovement[0] -= CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.Space) {
			cameraMovement[1] += CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.ShiftLeft) {
			cameraMovement[1] -= CAMERA_MOVEMENT_SPEED;
		}
		if(_KeyboardStatus.ControlLeft){
			v3.mulScalar(cameraMovement, 5, cameraMovement);
		}
		if(_KeyboardStatus.AltLeft){
			v3.mulScalar(cameraMovement, 0.25, cameraMovement);
		}
	}

	v3.mulScalar(cameraMovement, deltaTime, cameraMovement);


	let cameraMatrix = m4.identity();
	m4.rotateZ(cameraMatrix, camera.rotation[2] * (Math.PI/180), cameraMatrix);
	m4.rotateY(cameraMatrix, camera.rotation[1] * (Math.PI/180), cameraMatrix);
	m4.rotateX(cameraMatrix, camera.rotation[0] * (Math.PI/180), cameraMatrix);

	m4.transformPoint(cameraMatrix, cameraMovement, cameraMovement);
	//camera.position[1] += deltaTime*1;
	//camera.position[2] += deltaTime*1;
	camera.position[0] += cameraMovement[0];
	camera.position[1] += cameraMovement[1];
	camera.position[2] += cameraMovement[2];
	posx.innerText = Math.round(camera.position[0]*1000)/1000;
	posy.innerText = Math.round(camera.position[1]*1000)/1000;
	posz.innerText = Math.round(camera.position[2]*1000)/1000;
	rotx.innerText = Math.round(camera.rotation[0]*1000)/1000;
	roty.innerText = Math.round(camera.rotation[1]*1000)/1000;
	rotz.innerText = Math.round(camera.rotation[2]*1000)/1000;


	m4.identity(cameraMatrix);
	m4.perspective(40 * Math.PI / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, +(0.01), camera.renderDistance, cameraMatrix);
	m4.rotateX(cameraMatrix, camera.rotation[0] * (Math.PI/180), cameraMatrix);
	m4.rotateY(cameraMatrix, camera.rotation[1] * (Math.PI/180), cameraMatrix);
	m4.rotateZ(cameraMatrix, camera.rotation[2] * (Math.PI/180), cameraMatrix);
	m4.translate(cameraMatrix, [-camera.position[0], -camera.position[1], camera.position[2]], cameraMatrix);
	//m4.scale(cameraMatrix, [1,1,camera.renderDistance], cameraMatrix);

	const standardUniforms = {
		resolution: [gl.canvas.width, gl.canvas.height],
		//cameraMatrix,
	};

	gl.useProgram(programInfo.program);
	twgl.setUniforms(programInfo, standardUniforms);

	//twgl.drawBufferInfo(gl, bufferInfo);

	performRender(cameraMatrix);

	_LastRenderTime = time;
	requestAnimationFrame(render);
}
asset.then((a)=>{
	asset = a;
	console.log(asset);
	let obj = asset.generateObject3();
	_globalScene.appendChild(obj);
	requestAnimationFrame(render);
});
//requestAnimationFrame(render);