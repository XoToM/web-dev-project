function render(deltaTime){
	NoclipCamera(deltaTime);
}
{
	const vert_shader = getFileSync("shaders/vert.glsl");
	const default_shader_program = twgl.createProgramInfo(gl, [vert_shader, getFileSync("shaders/frag.glsl")]);
	const ground_shader_program = twgl.createProgramInfo(gl, [vert_shader, getFileSync("shaders/ground_frag.glsl")]);
	const light_cube_shader_program = twgl.createProgramInfo(gl, [vert_shader, getFileSync("shaders/light_cube_frag.glsl")]);

	_assetManager.loadModel(
		"tests/light_cube.gltf",
		"light_cube",
		light_cube_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
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
		"tests/test1.gltf",
		"test1",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
	_assetManager.loadModel(
		"tests/test3.gltf",
		"test3",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
	_assetManager.loadModel(
		"tests/test4.gltf",
		"test4",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
	_assetManager.loadModel(
		"tests/test5.gltf",
		"test5",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		});
	_assetManager.loadModel(
		"tests/blender_monkey.gltf",
		"blender_monkey",
		default_shader_program,
		{
			position: "a_position",
			normal: "a_normal",
			colorTexCoord: "a_colorTexCoord",
			colorSampler: "u_colorTexture",
		}
	);
	_assetManager.loadModel("game/models/player.gltf","player", default_shader_program, {
		position: "a_position",
		normal: "a_normal",
		colorTexCoord: "a_colorTexCoord",
		colorSampler: "u_colorTexture",
	})


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
let cube1,cube2,cube3,blender_monkey,player;
(async ()=>{
	await _assetManager.finishedLoading();
	cube1_spin = await _assetManager.generateObject3("default_cube");
	cube1_spain = await _assetManager.generateObject3("default_cube");
	cube1_pain = await _assetManager.generateObject3("default_cube");
	cube1_mlinear = await _assetManager.generateObject3("default_cube");
	cube1_mstep = await _assetManager.generateObject3("default_cube");
	cube2 = await _assetManager.generateObject3("default_cube");
	cube3 = await _assetManager.generateObject3("default_cube");
	test1 = await _assetManager.generateObject3("test1");
	test3 = await _assetManager.generateObject3("test3");
	test4 = await _assetManager.generateObject3("test4");
	test5 = await _assetManager.generateObject3("test5");
	blender_monkey = await _assetManager.generateObject3("blender_monkey");
	player = await _assetManager.generateObject3("player");

	blender_monkey.position[0] += 5;
	blender_monkey.position[2] -= 7.5;
	cube1_spain.position[2] -= 3;
	cube1_pain.position[2] -= 6;
	cube1_mlinear.position[2] -= 9;
	cube1_mstep.position[2] -= 12;
	cube2.position[0] -= 1;
	cube3.position[0] += 1;
	test1.position[0] += 3;
	test3.position[0] += 4;
	test4.position[0] += 5;
	test5.position[0] += 6;
	player.position[0] -= 3;

	let plight1 = new PointLight3D({position:[2,-2,-8]});
	let pldc1 = await _assetManager.generateObject3("light_cube");
	//pldc1.scaling = v3.create(0.25,0.25,0.25);
	plight1.appendChild(pldc1);
	_globalScene.appendChild(plight1);

	let plight2 = new PointLight3D({position:[2,-2,2]});
	plight2.lightColor = [1.0,0.0,0.0];
	let pldc2 = await _assetManager.generateObject3("light_cube");
	//pldc2.scaling = v3.create(0.25,0.25,0.25);
	plight2.appendChild(pldc2);
	_globalScene.appendChild(plight2);

	for(let i=0; i<32; i++){
		let plight3 = new PointLight3D({position:[-4,-4,4+(i*-3)]});
		let col = [Math.random(),Math.random(),Math.random()];
		let max = Math.max(...col);
		plight3.lightColor = [col[0]/max, col[1]/max, col[2]/max];
		//console.log(plight3.lightColor);
		let pldc3 = await _assetManager.generateObject3("light_cube");
		//pldc3.scaling = v3.create(0.25,0.25,0.25);
		plight3.appendChild(pldc3);
		_globalScene.appendChild(plight3);
	}

	_globalScene.appendChild(cube1_spin);
	_globalScene.appendChild(cube1_spain);
	_globalScene.appendChild(cube1_pain);
	_globalScene.appendChild(cube1_mlinear);
	_globalScene.appendChild(cube1_mstep);

	_globalScene.appendChild(cube2);
	_globalScene.appendChild(cube3);

	_globalScene.appendChild(test1);
	_globalScene.appendChild(test3);
	_globalScene.appendChild(test4);
	_globalScene.appendChild(test5);
	//*/
	_globalScene.appendChild(blender_monkey);
	_globalScene.appendChild(player);
	let plane = new Object3();

	let ground = await _assetManager.generateObject3("ground_plane");
	ground.scaling[0] = 50;
	ground.position[1] = -10;
	ground.scaling[2] = 50;
	plane.appendChild(ground);

	_globalScene.appendChild(plane);

	let animate_manual = ()=>{
		let promise = new Promise((resolve)=>{
			blender_monkey.rotation[1] = ((blender_monkey.rotation[1]+180.5)%360) - 180;
			setTimeout(resolve,25);
		});
		promise.then(animate_manual);
	}

	cube1_spin.animationPlayer.play("cube.spin", {mode:ANIMATION_MODES.LOOP});
	cube1_spain.animationPlayer.play("cube.spain", {mode:ANIMATION_MODES.LOOP});
	cube1_pain.animationPlayer.play("cube.pain", {mode:ANIMATION_MODES.LOOP});
	cube1_mlinear.animationPlayer.play("cube.move.linear", {mode:ANIMATION_MODES.LOOP});
	cube1_mstep.animationPlayer.play("cube.move.step", {mode:ANIMATION_MODES.LOOP});

	test1.animationPlayer.play("animation.model.bend", {mode:ANIMATION_MODES.LOOP});
	test3.animationPlayer.play("animation.model.bend", {mode:ANIMATION_MODES.LOOP});
	test4.animationPlayer.play("animation.model.bend", {mode:ANIMATION_MODES.LOOP});
	test5.animationPlayer.play("animation.model.bend", {mode:ANIMATION_MODES.LOOP});
	animate_manual();

	player.playAnimation("player.flop", {mode:ANIMATION_MODES.PLAY_CLAMP});
})();
