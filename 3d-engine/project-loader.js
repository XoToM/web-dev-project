document.querySelector(".overlay").style.display = "none";



async function loadProject(project){
	if(!project) return;
	let promise = new Promise((accept,reject)=>{
		try{
			let script = document.createElement("script");
			project = project.substring(1);
			script.onerror = (e)=>{
				console.error("Error while loading project: ", e);
				reject();
			};
			script.onload = ()=>{
				document.querySelector(".overlay").style.display = "initial";
				accept();
			}
			script.src = "/3d-engine/game/scene-scripts/" + project+".js";
			document.querySelector("head").appendChild(script);
		}catch(e){
			console.error("Error while loading project: ", e);
			reject();
		}
	});
	await promise;
}

(async ()=>{
	let proj_waiter = await loadProject(document.location.hash || "#blank");
	if (!proj_waiter){
		let links = document.querySelectorAll("#project-selector a");

		for(let i=0;i<links.length;i++){
			console.log(links[i]);
			links[i].onclick = async (e)=>{
				if(links[i].hash) {
					location.hash = links[i].hash;
					location.reload();
				}
				return true;
			};
		}
}
})();