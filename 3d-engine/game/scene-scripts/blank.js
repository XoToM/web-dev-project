//	Load shaders asynchronously
const default_vert_shader = getFileAsync("/3d-engine/shaders/vert.glsl");
const default_shader_program = (async ()=>{return twgl.createProgramInfo(gl, [await default_vert_shader, await getFileAsync("/3d-engine/shaders/frag.glsl")]);})();
const ground_shader_program = (async ()=>{return twgl.createProgramInfo(gl, [await default_vert_shader, await getFileAsync("/3d-engine/shaders/ground_frag.glsl")]);})();
const light_cube_shader_program = (async ()=>{return twgl.createProgramInfo(gl, [await default_vert_shader, await getFileAsync("/3d-engine/shaders/light_cube_frag.glsl")]);})();


//	Load needed assets
_assetManager.loadModel(
	"/3d-engine/game/models/ground_plane.gltf",
	"ground_plane",
	ground_shader_program,
	{
		position: "a_position",
		normal: "a_normal",
		colorTexCoord: "a_colorTexCoord",
		colorSampler: "u_colorTexture",
	}
);
_assetManager.loadModel(
	"/3d-engine/game/models/light_cube.gltf",
	"light_cube",
	light_cube_shader_program,
	{
		position: "a_position",
		normal: "a_normal",
		colorTexCoord: "a_colorTexCoord",
		colorSampler: "u_colorTexture",
	});

(async ()=>{
	await _assetManager.finishedLoading();	//	Wait for assets to load

	let plane = new Object3();

	let ground = await _assetManager.generateObject3("ground_plane");	//	Generate ground object and make it big. The engine cant render lines yet, so a textured plane has to do for now
	ground.scaling[0] = 50;
	ground.position[1] = -5;
	ground.scaling[2] = 50;
	plane.name = "Ground grid plane";
	plane.appendChild(ground);

	_globalScene.appendChild(plane);	//	Add ground to scene


	let point_light1 = new PointLight3D({position:[-3,-3,-10]});		//	Add a point light to the scene
	let point_light1_cube = await _assetManager.generateObject3("light_cube");	//	Give the point light a cube so it is easier to see where it is
	point_light1.appendChild(point_light1_cube);
	_globalScene.appendChild(point_light1);

	setTimeout(()=>{windowAutoHide = false;}, 500);	//	Stop objects from hiding automatically
})();

function render(deltaTime){	//	This function gets called every frame and is used for controlling the camera. If you were making a full game you could put extra scripts here like physics calculations
	NoclipCamera(deltaTime);	//	Handles camera input and movement
}