class LightSource3D extends Object3 {
	lightColor = new Float32Array([1,1,1]);
	ambientInfluence = 0.1;
	diffuseInfluence = 0.7;
	specularInfluence = 0.7;
	self = this;
}
class PointLight3D extends LightSource3D {
	attenuation = { constant:1, linear:0.14, quadratic:0.07 };
	//attenuation = { constant:1, linear:0.09, quadratic:0.032 };
	//attenuation = { constant:1, linear:0.07, quadratic:0.017 };

	onChildAdded(parent){
		__LightManager.point.push(this);
	}
	onChildRemoved(parent){
		for(let i=0; i<__LightManager.point.length; i++){
			if(__LightManager.point[i] === this.self){
				let popped = __LightManager.point.pop();
				if(i !== __LightManager.point.length) {
					__LightManager.point[i] = popped;
				}
				return;
			}
		}
	}
	generateData(){
		return {
			position: v3.copy(this.position),
			lightColor: v3.copy(this.lightColor),
			lightPowers: [this.ambientInfluence, this.diffuseInfluence, this.specularInfluence],
			attenuation: [this.attenuation.constant, this.attenuation.linear, this.attenuation.quadratic]
		};
	}
}
class SpotLight3D extends LightSource3D {

}
const __LightManager = {
	directional:{
		ambientInfluence: 0.1,
		diffuseInfluence: 0.7,
		specularInfluence: 0.7,
		//power: v3.create(0.1, 0.7, 0.7),
		direction: v3.create(0,0.5,0.5),
		lightColor: v3.create(1,1,1),
	},
	lightRenderChildren: true,
	point:[]
};