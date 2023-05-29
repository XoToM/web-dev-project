document.querySelector(".overlay").style.display = "none";	//	Hide the position overlay if no project is selected. It will contain garbage text


async function loadProject(project){	//	Load project script from link
	if(!project) return;
	let promise = new Promise((accept,reject)=>{
		try{
			let script = document.createElement("script");	//	Create and add the script to DOM and wait for it to load
			project = project.substring(1);

			script.onerror = (e)=>{
				alert("Could not load the project.");
				console.error("Error while loading project: ", e);
				reject();
			};
			script.onload = ()=>{
				document.querySelector(".overlay").style.display = "initial";
				accept();
			}
			script.src = "game/scene-scripts/" + project+".js";
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
