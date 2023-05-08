function render(deltaTime){
	NoclipCamera(deltaTime);
}
{
	const vert_shader = getFileSync("shaders/vert.glsl");
	const default_shader_program = twgl.createProgramInfo(gl, [vert_shader, getFileSync("shaders/frag.glsl")]);
	const ground_shader_program = twgl.createProgramInfo(gl, [vert_shader, getFileSync("shaders/ground_frag.glsl")]);

	_assetManager.loadModel(
		"tests/default_cube.gltf",
		"default_cube",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
	_assetManager.loadModel(
		"tests/ground_plane.gltf",
		"ground_plane",
		ground_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		}
	);
}
let cube1,cube2,cube3;
(async ()=>{
	await _assetManager.finishedLoading();
	cube1 = await _assetManager.generateObject3("default_cube");
	cube2 = await _assetManager.generateObject3("default_cube");
	cube3 = await _assetManager.generateObject3("default_cube");
	cube2.position[0] -= 1;
	cube3.position[0] += 1;
	_globalScene.appendChild(cube1);
	_globalScene.appendChild(cube2);
	_globalScene.appendChild(cube3);
	let plane = new Object3();

	let ground = await _assetManager.generateObject3("ground_plane");
	ground.scaling[0] = 50;
	ground.position[1] = -10;
	ground.scaling[2] = 50;
	plane.appendChild(ground);

	_globalScene.appendChild(plane);
	console.log(cube1);

	let animate = ()=>{
		let promise = cube1.animationPlayer.play("cube.spin");
		promise.then(animate)
		console.log("Restarting animation");
	}
	//animate();
})();
