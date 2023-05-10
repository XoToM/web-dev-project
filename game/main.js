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
let cube1,cube2,cube3,blender_monkey;
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
	
	blender_monkey.position[0] += 5;
	blender_monkey.position[2] -= 5;
	/*cube1_spain.position[2] -= 3;
	cube1_pain.position[2] -= 6;
	cube1_mlinear.position[2] -= 9;
	cube1_mstep.position[2] -= 12;
	cube2.position[0] -= 1;
	cube3.position[0] += 1;
	test1.position[0] += 3;
	test3.position[0] += 4;
	test4.position[0] += 5;
	test5.position[0] += 6;
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
	let plane = new Object3();

	let ground = await _assetManager.generateObject3("ground_plane");
	ground.scaling[0] = 50;
	ground.position[1] = -10;
	ground.scaling[2] = 50;
	plane.appendChild(ground);

	_globalScene.appendChild(plane);
	//console.log(cube1);

	let animatec1 = ()=>{
		let promise = cube1_spin.animationPlayer.play("cube.spin");
		promise.then(animatec1);
		//console.log("Restarting animation");
	}
	let animatec2 = ()=>{
		let promise = cube1_spain.animationPlayer.play("cube.spain");
		promise.then(animatec2);
		//console.log("Restarting animation");
	}
	let animatec3 = ()=>{
		let promise = cube1_pain.animationPlayer.play("cube.pain");
		promise.then(animatec3);
		//console.log("Restarting animation");
	}
	let animatec4 = ()=>{
		let promise = cube1_mlinear.animationPlayer.play("cube.move.linear");
		promise.then(animatec4);
		//console.log("Restarting animation");
	}
	let animatec5 = ()=>{
		let promise = cube1_mstep.animationPlayer.play("cube.move.step");
		promise.then(animatec5);
		//console.log("Restarting animation");
	}
	let animatec = ()=>{
		let promise = cube1.animationPlayer.play("cube.spin");
		promise.then(animatec);
		//console.log("Restarting animation");
	}

	let animate1 = ()=>{
		let promise = test1.animationPlayer.play("animation.model.bend");
		promise.then(animate1);
	}
	let animate3 = ()=>{
		let promise = test3.animationPlayer.play("animation.model.bend");
		promise.then(animate3);
	}
	let animate4 = ()=>{
		let promise = test4.animationPlayer.play("animation.model.bend");
		promise.then(animate4);
	}
	let animate5 = ()=>{
		let promise = test5.animationPlayer.play("animation.model.bend");
		promise.then(animate5);
	}
	let animate_manual = ()=>{
		let promise = new Promise((resolve)=>{
			blender_monkey.rotation[1] = ((blender_monkey.rotation[1]+180.5)%360) - 180;
			setTimeout(resolve,25);
		});
		promise.then(animate_manual);
	}

	animatec1();
	animatec2();
	animatec3();
	animatec4();
	animatec5();

	animate1();
	animate3();
	animate4();
	animate5();
	animate_manual();
})();
