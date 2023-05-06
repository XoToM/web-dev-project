class AnimationPlayer{
	childMap = new Map();
	animationRoot = null;

	animationMap = new Map();

	constructor(obj, animations){
		this.animationRoot = obj;
		this.animationMap = animations;
	}

}