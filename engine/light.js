class LightSource3D extends Object3 {
	lightPower = 1;

}
class PointLight3D extends LightSource3D {

}
class SpotLight3D extends LightSource3D {

}
const __LightManager = {
	directional:{
		power: v3.create(0.1, 0.6, 0.6),	//	influence of the different light components (after calculation they are multiplied by this). The order is x:ambient, y:diffuse, z:specular
		direction: v3.create(0,0.5,0.5),
		lightColor: v3.create(1,1,1)
	},
	point:[]
};