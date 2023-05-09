const TWO_PI = Math.PI * 2;
const __ANIMATION_HELPERS = {
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
	keyframeBinarySearch: (array, time)=>{
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
	play(name, timestamp){
		__ANIMATION_PLAYERS.add(this);
		let anim = this.animationMap.get(name);
		if(anim){
			let promise = new Promise((resolve,reject)=>{
				this.playing.push({name, onFinish:resolve, onStop:reject, time: (timestamp || 0), playTime:anim.playTime, playing:true, animation:this.animationMap.get(name)});
			});
			return promise;
		}
		return null;
	}
	stop(anim){
		if(anim){
			let index = -1;
			if(typeof(anim) == "string"){
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

			let our = this.playing[index];
			let last = this.playing.pop();

			if(this.playing.length !== 0 && our !== last){
				this.playing[index] = last;
			}
			if(our.onStop) our.onStop(our);

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
	stepAnimations(deltaTime){
		//deltaTime = 0.001;	//	Fixed delta time for animation debugging
		let toCleanUp = [];
		for(let anim of this.playing){
			if(anim.playing) anim.time += deltaTime;

			if(anim.playTime <= anim.time){
				toCleanUp.push(anim);
				anim.onStop = null;
				anim.onFinish(anim.time - anim.playTime);
			}
		}
		while(toCleanUp.length){
			this.stop(toCleanUp.pop());
		}
	}
	calculateAdjust(obj, adjustment){
		adjustment = adjustment || {};


		for(let animationInfo of this.playing){
			let animation = animationInfo.animation;
			let channels = animation.get(obj);
			if(!channels) continue;

			if(channels.position){
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
			if(channels.scale){
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
			if(channels.rotation){
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

					let [axisX,axisY,axisZ,axisAngle] = __ANIMATION_HELPERS.quaternion_to_axis_angle(result[0],result[1],result[2],result[3]);

					m4.axisRotate(adjustment.rotation, [axisX,axisY,axisZ],axisAngle, adjustment.rotation);
				}
			}
		}

		return adjustment;
	}

}