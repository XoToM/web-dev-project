//	Store the DOM elements for displaying camera's position and rotation
const [posx,posy,posz, rotx,roty,rotz] = [document.getElementById("posx"), document.getElementById("posy"), document.getElementById("posz"), document.getElementById("rotx"), document.getElementById("roty"), document.getElementById("rotz")];

let MOUSE_SENSITIVITY = 15;	//	Mouse sensitivity	-	These can be changed through console
let CAMERA_MOVEMENT_SPEED = 5;	//	Default movement speed

canvas.addEventListener("click", async () => {	//	Wait for the user to click on the canvas to capture their mouse
	if (!document.pointerLockElement) {
		 canvas.requestPointerLock({
			unadjustedMovement: true,
		});
	}
});
function _onMouseMove(e){	//	rotate the camera to reflect how the user is moving around
	Camera.rotation[1] = (Camera.rotation[1] + (e.movementX/MOUSE_SENSITIVITY))%360;
	Camera.rotation[0] = Math.max(Math.min(Camera.rotation[0] + (e.movementY/MOUSE_SENSITIVITY), 90), -90);
}
document.addEventListener("pointerlockchange", ()=>{	//	Capture the mouse
	if (document.pointerLockElement === canvas) {
		document.addEventListener("mousemove", _onMouseMove, false);
	} else {
		document.removeEventListener("mousemove", _onMouseMove, false);
		for(let [key, _] of Object.entries(_KeyboardStatus)){
			_KeyboardStatus[key] = false;
		}
	}
}, false);
let _KeyboardStatus = {};
document.addEventListener("keydown", (e)=>{	//	Store keypresses for later
	if(document.pointerLockElement === canvas){
		if(e.code !== "CapsLock") _KeyboardStatus[e.code] = true;
		_KeyboardStatus.CapsLock = e.getModifierState && e.getModifierState( 'CapsLock' );	//	Capslock works differently to other keys
		e.preventDefault();
	}
});
document.addEventListener("keyup", (e)=>{	//	Store keypresses for later
	if(document.pointerLockElement === canvas){
		if(e.code !== "CapsLock") _KeyboardStatus[e.code] = false;
		e.preventDefault();
	}
});


function NoclipCamera(deltaTime){					//	Simple Noclip Camera
	let cameraMovement = v3.create(0,0,0);
	if (document.pointerLockElement === canvas){		//	If the canvas has captured the user's mouse process movement
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
		if(_KeyboardStatus.CapsLock){
			v3.mulScalar(cameraMovement, 5, cameraMovement);
		}
		if(_KeyboardStatus.AltLeft){
			v3.mulScalar(cameraMovement, 0.25, cameraMovement);
		}
	}

	v3.mulScalar(cameraMovement, deltaTime, cameraMovement);


	let cameraMatrix = m4.identity();			//	calculate the transformation matrix needed for moving the camera around
	m4.rotateZ(cameraMatrix, Camera.rotation[2] * (Math.PI/180), cameraMatrix);
	m4.rotateY(cameraMatrix, Camera.rotation[1] * (Math.PI/180), cameraMatrix);
	m4.rotateX(cameraMatrix, Camera.rotation[0] * (Math.PI/180), cameraMatrix);

	m4.transformPoint(cameraMatrix, cameraMovement, cameraMovement);

	Camera.position[0] += cameraMovement[0];	//	Move the camera
	Camera.position[1] += cameraMovement[1];
	Camera.position[2] += cameraMovement[2];

	posx.innerText = Math.round(Camera.position[0]*1000)/1000;	//	Update the overlay on the screen
	posy.innerText = Math.round(Camera.position[1]*1000)/1000;
	posz.innerText = Math.round(Camera.position[2]*1000)/1000;
	rotx.innerText = Math.round(Camera.rotation[0]*1000)/1000;
	roty.innerText = Math.round(Camera.rotation[1]*1000)/1000;
	rotz.innerText = Math.round(Camera.rotation[2]*1000)/1000;
}