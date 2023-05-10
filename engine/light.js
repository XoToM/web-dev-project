class LightSource3D extends Object3 {
	lightPower = 1;

}
class PointLight3D extends LightSource3D {

}
class SpotLight3D extends LightSource3D {

}
const __LightManager = {
	directional:{
		enabled:true,
		directionPower: v3.create(0,0,0),
		lightColor: v3.create(1,1,1)
	}
};