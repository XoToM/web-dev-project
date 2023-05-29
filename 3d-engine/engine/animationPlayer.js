const TWO_PI = Math.PI * 2;
const ANIMATION_MODES = {PLAY_ONCE:0, LOOP:1, PLAY_CLAMP:2};	//	Animation Modes
const __ANIMATION_HELPERS = {	//	Helper methods for calculating interpolations
	lerp: (ax,ay,az, bx,by,bz, t)=>{
		let rx = (1-t)*ax + t*bx;
		let ry = (1-t)*ay + t*by;
		let rz = (1-t)*az + t*bz;
		return [rx, ry, rz];
	},
	step: (ax,ay,az, bx,by,bz,t)=>{
		return [bx,by,bz];
	},
	slerp: (ax,ay,az,aw, bx,by,bz,bw, t)=>{
		let cosHalfTheta = ax*bx + ay*by + az*bz + aw*bw;

		if(Math.abs(cosHalfTheta) >= 1.0){
			return [ax,ay,az,aw];
		}

		let halfTheta = Math.acos(cosHalfTheta);
		let sinHalfTheta = Math.sqrt(1 - cosHalfTheta * cosHalfTheta);

		if(Math.abs(sinHalfTheta) < 0.001){
			return [ax*0.5+bx*0.5, ay*0.5+by*0.5, az*0.5+bz*0.5, aw*0.5+bw*0.5];
		}

		let ratioA = Math.sin((1-t)*halfTheta)/sinHalfTheta;
		let ratioB = Math.sin(t*halfTheta)/sinHalfTheta;

		return [ax*ratioA+bx*ratioB, ay*ratioA+by*ratioB, az*ratioA+bz*ratioB, aw*ratioA+bw*ratioB];
	},
	keyframeBinarySearch: (array, time)=>{	//	Finds the closest 2 keyframes to the given time
		let start = 0;
		let end = array.length-1;
		if(array[start] >= time){
			return [0,0];
		}
		if(array[end] <= time){
			return [end, end];
		}


		while(start <= end){
			let mid = ((end-start)>>1)+start;

			if(array[mid] <= time && array[mid+1] >= time){
				return [mid, mid+1]
			}
			if(array[mid]<time){
				start = mid;
			}else{
				end = mid;
			}
		}
	},
	quaternion_to_axis_angle: (qx,qy,qz,qw)=>{
		let length = Math.sqrt(qx*qx+qy*qy+qz*qz);
		let inverse_length = 1/length;

		return [qx*inverse_length,qy*inverse_length,qz*inverse_length, 2*Math.atan2(length, qw)];
	}
};
const __ANIMATION_PLAYERS = new Set();
class AnimationPlayer{
	childMap = new Map();
	animationRoot = null;

	animationMap = new Map();
	playing = [];


	constructor(obj, animations){
		this.animationRoot = obj;
		this.animationMap = animations;
	}
	play(name, params){	//	Play animation
		if(!params) params = {};
		let timestamp = params.timestamp || 0;
		let mode = params.mode || ANIMATION_MODES.PLAY_ONCE;
		__ANIMATION_PLAYERS.add(this);
		let anim = this.animationMap.get(name);
		if(anim){
			let a;
			let promise = new Promise((resolve,_)=>{
				a = {name,mode, onFinish:resolve, onStop:resolve, time: (timestamp || 0), playTime:anim.playTime, playing:true, animation:this.animationMap.get(name)};
				this.playing.push(a);
			});
			a.promise = promise;
			return promise;
		}
		return null;
	}
	stop(anim){	//	Pause animation
		if(anim){
			let index = -1;
			if(typeof(anim) == "string"){	//	If anim is string look up animation based on its name instead of animation data reference
				for(let i=0; i<this.playing.length; i++){
					if(this.playing[i].name == anim){
						index = i;
						break;
					}
				}
			}else{
				for(let i=0; i<this.playing.length; i++){
					if(this.playing[i] === anim){
						index = i;
						break;
					}
				}
			}
			if(index === -1) return null;

			let our = this.playing[index];	//	Remove animation from the list of playing animations without using array.splice.	Array.splice is slower because it tries to preserve the order of the array, while this method simply removes the object and replaces it with the last object in the list
			let last = this.playing.pop();

			if(this.playing.length !== 0 && our !== last){
				this.playing[index] = last;
			}
			if(our.onStop) try{our.onStop(our);}catch(e){console.error(e)}

			if(this.playing.length === 0) __ANIMATION_PLAYERS.delete(this);
			return our;
		}else{
			let played = this.playing;
			this.playing = [];

			for(let anim of played){
				anim.onFinish = null;
				anim.playing = false;
				anim.onStop(anim);
			}
			__ANIMATION_PLAYERS.delete(this);

			return played;
		}
	}
	stepAnimations(deltaTime){	//	Calculate how far the animations have progressed since last frame
		//deltaTime = 0.001;	//	Fixed delta time for animation debugging
		let toCleanUp = [];
		for(let anim of this.playing){
			if(!anim.playing) continue;
			anim.time += deltaTime;

			if(anim.playTime <= anim.time){	//	What to do when animations finish
				switch(anim.mode){
					case ANIMATION_MODES.PLAY_ONCE:	//	Remove animation fro the list of playing animations
						toCleanUp.push(anim);
						anim.onStop = null;
						anim.onFinish(anim.time - anim.playTime);
						break;
					case ANIMATION_MODES.LOOP:	//	restart animation
						anim.time -= anim.playTime;
						break;
					case ANIMATION_MODES.PLAY_CLAMP:	//	Pause animation on last frame
						anim.playing = false;
						anim.time = anim.playTime;
						break;
				}
			}
		}
		while(toCleanUp.length){
			this.stop(toCleanUp.pop());	//	Remove animations which finished playing
		}
	}
	calculateAdjust(obj, adjustment){	//	Calculate the adjustments for the transform matrix
		adjustment = adjustment || {};


		for(let animationInfo of this.playing){
			let animation = animationInfo.animation;
			let channels = animation.get(obj);
			if(!channels) continue;

			if(channels.position){	//	Calculate the interpolation for the object's position
				adjustment.position = adjustment.position || [0,0,0];
				let [kfa, kfb] = __ANIMATION_HELPERS.keyframeBinarySearch(channels.position.keyframes, animationInfo.time);

				let values = channels.position.values;
				let keyframes = channels.position.keyframes;
				let pointer;
				if(kfa === kfb){
					pointer = kfa*channels.position.stride;
					adjustment.position[0] += values[pointer++];
					adjustment.position[1] += values[pointer++];
					adjustment.position[2] += values[pointer];
				}else{
					let a;
					let progress = (animationInfo.time - keyframes[kfa])/(keyframes[kfb]-keyframes[kfa]);
					pointer = kfa*channels.position.stride;
					switch(channels.position.interpolation){
						case "LINEAR":
							a = __ANIMATION_HELPERS.lerp(values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer], progress);
							break;
						case "STEP":
							a = __ANIMATION_HELPERS.step(values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer], progress);
							break;
						case "CUBICSPLINE":
							console.error("Cubic interpolation is not supported yet");
							break;
						default:
							console.error("Unknown value: ", animation.interpolation);
							break;
					}
					adjustment.position[0] += a[0];
					adjustment.position[1] += a[1];
					adjustment.position[2] += a[2];
				}
			}
			if(channels.scale){		//	Calculate the interpolation for the object's scale
				adjustment.scale = adjustment.scale || [1,1,1];
				let [kfa, kfb] = __ANIMATION_HELPERS.keyframeBinarySearch(channels.scale.keyframes, animationInfo.time);

				let values = channels.scale.values;
				let keyframes = channels.scale.keyframes;
				let pointer;
				if(kfa === kfb){
					pointer = kfa*channels.scale.stride;
					adjustment.scale[0] *= values[pointer++];
					adjustment.scale[1] *= values[pointer++];
					adjustment.scale[2] *= values[pointer];
				}else{
					let a;
					let progress = (animationInfo.time - keyframes[kfa])/(keyframes[kfb]-keyframes[kfa]);
					pointer = kfa*channels.scale.stride;
					switch(channels.scale.interpolation){
						case "LINEAR":
							a = __ANIMATION_HELPERS.lerp(values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer], progress);
							break;
						case "STEP":
							a = __ANIMATION_HELPERS.step(values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer++],values[pointer], progress);
							break;
						case "CUBICSPLINE":
							console.error("Cubic interpolation is not supported yet");
							break;
						default:
							console.error("Unknown value: ", animation.interpolation);
							break;
					}
					adjustment.scale[0] *= a[0];
					adjustment.scale[1] *= a[1];
					adjustment.scale[2] *= a[2];
				}
			}
			if(channels.rotation){	//	Calculate the interpolation for the object's rotation. You cannot use lerp with rotation, so we need to work in quaternions
				adjustment.rotation = adjustment.rotation || m4.identity();
				let [kfa, kfb] = __ANIMATION_HELPERS.keyframeBinarySearch(channels.rotation.keyframes, animationInfo.time);

				let values = channels.rotation.values;
				let keyframes = channels.rotation.keyframes;
				let pointer = kfa*channels.rotation.stride;
				let kfda = [values[pointer++],values[pointer++],values[pointer++],values[pointer++]];


				let result;
				if(kfa === kfb){
					result = kfda;
				}else{
					let kfdb = [values[pointer++],values[pointer++],values[pointer++],values[pointer]];
					let a;
					let progress = (animationInfo.time - keyframes[kfa])/(keyframes[kfb]-keyframes[kfa]);
					switch(channels.rotation.interpolation){
						case "LINEAR":
							result = __ANIMATION_HELPERS.slerp(kfda[0],kfda[1],kfda[2], kfda[3], kfdb[0],kfdb[1],kfdb[2],kfdb[3], progress);
							break;
						case "STEP":
							result = kfdb;
							break;
						case "CUBICSPLINE":
							console.error("Cubic interpolation is not supported yet");
							break;
						default:
							console.error("Unknown value: ", animation.interpolation);
							break;
					}
				}

				let [axisX,axisY,axisZ,axisAngle] = __ANIMATION_HELPERS.quaternion_to_axis_angle(result[0],result[1],result[2],result[3]);

				m4.axisRotate(adjustment.rotation, [axisX,axisY,axisZ],axisAngle, adjustment.rotation);
			}
		}

		return adjustment;
	}

}