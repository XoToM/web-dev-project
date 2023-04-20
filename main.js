const gl = document.getElementById("canvasgl").getContext("webgl");

var getFileSync = function(url) {
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	req.send(null);
	return (req.status == 200) ? req.responseText : null;
};

const programInfo = twgl.createProgramInfo(gl, [getFileSync("shaders/vert.glsl"), getFileSync("shaders/frag.glsl")]);
 
const arrays = {
	position: [-1, -1, 0, 1, -1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1, 1, 0],
};
const bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays);
 


function render(time) {
	twgl.resizeCanvasToDisplaySize(gl.canvas);
	gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
 
	const uniforms = {
	  time: time * 0.001,
	  resolution: [gl.canvas.width, gl.canvas.height],
	};
 
	gl.useProgram(programInfo.program);
	twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
	twgl.setUniforms(programInfo, uniforms);
	twgl.drawBufferInfo(gl, bufferInfo);
 
	requestAnimationFrame(render);
}
requestAnimationFrame(render);