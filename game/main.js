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
(async ()=>{
	await _assetManager.finishedLoading();
	let cube1 = await _assetManager.generateObject3("default_cube");
	let cube2 = await _assetManager.generateObject3("default_cube");
	let cube3 = await _assetManager.generateObject3("default_cube");
	cube2.position[0] -= 1;
	cube3.position[0] += 1;
	_globalScene.appendChild(cube1);
	_globalScene.appendChild(cube2);
	_globalScene.appendChild(cube3);
	for(let z=-10;z<10;z++){
		for(let x=-10;x<10;x++){
			let ground = await _assetManager.generateObject3("ground_plane");
			ground.position[0] = 4*x;
			ground.position[1] = -10;
			ground.position[2] = 4*z;
			_globalScene.appendChild(ground);
		}
	}
})()
