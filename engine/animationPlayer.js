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
	slerp: (ax,ay,az, bx,by,bz, t)=>{	//	horrible, horrible, horrible implementation of the SLERP function. Works by performing linear interpolation on the angles. I don't know how the better solution works yet, so I implemented this instead.
		let rx,ry,rz;
		if(Math.abs(ax-bx) < Math.abs((ax+TWO_PI)-bx)){
			rx = ax-bx;
		}else{
			rx = (TWO_PI+ax)-bx;
		}
		if(Math.abs(ay-by) < Math.abs((ay+TWO_PI)-by)){
			ry = ay-by;
		}else{
			ry = (TWO_PI+ay)-by;
		}
		if(Math.abs(az-bz) < Math.abs((az+TWO_PI)-bz)){
			rz = az-bz;
		}else{
			rz = (TWO_PI+az)-bz;
		}

		rx *= t;
		ry *= t;
		rz *= t;

		return [ax+rx, ay+ry, az+rz];
	},
	quaternion_to_euler_angles: (qx,qy,qz,qw)=>{
		// roll (y-axis rotation)
		let sinr_cosp = 2 * (qw * qx + qy * qz);
		let cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
		let roll = Math.atan2(sinr_cosp, cosr_cosp);

		// pitch (y-axis rotation)
		let sinp = Math.sqrt(1 + 2 * (qw * qy - qx * qz));
		let cosp = Math.sqrt(1 - 2 * (qw * qy - qx * qz));
		let pitch = 2 * Math.atan2(sinp, cosp) - Math.PI / 2;

		// yaw (z-axis rotation)
		let siny_cosp = 2 * (qw * qz + qx * qy);
		let cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
		let yaw = Math.atan2(siny_cosp, cosy_cosp);
		return [roll, pitch, yaw];
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
				return [mid+1, mid]
			}
			if(array[mid]<time){
				start = mid;
			}else{
				end = mid;
			}
		}
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
					pointer = kfb*channels.position.stride;
					switch(channels.position.interpolation){
						case "LINEAR":
							a = __ANIMATION_HELPERS.lerp(pointer++,pointer++,pointer++,pointer++,pointer++,pointer, progress);
							break;
						case "STEP":
							a = __ANIMATION_HELPERS.step(pointer++,pointer++,pointer++,pointer++,pointer++,pointer, progress);
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
					pointer = kfb*channels.scale.stride;
					switch(channels.scale.interpolation){
						case "LINEAR":
							a = __ANIMATION_HELPERS.lerp(pointer++,pointer++,pointer++,pointer++,pointer++,pointer, progress);
							break;
						case "STEP":
							a = __ANIMATION_HELPERS.step(pointer++,pointer++,pointer++,pointer++,pointer++,pointer, progress);
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
				adjustment.rotation = adjustment.rotation || [0,0,0];
				let [kfa, kfb] = __ANIMATION_HELPERS.keyframeBinarySearch(channels.rotation.keyframes, animationInfo.time);

				let values = channels.rotation.values;
				let keyframes = channels.rotation.keyframes;
				let pointer = kfb*channels.rotation.stride;
				let kfda = __ANIMATION_HELPERS.quaternion_to_euler_angles(values[pointer++],values[pointer++],values[pointer++],values[pointer++]);
				if(kfa === kfb){
					adjustment.rotation[0] += kfda[0];
					adjustment.rotation[1] += kfda[0];
					adjustment.rotation[2] += kfda[0];
				}else{
					let kfdb = __ANIMATION_HELPERS.quaternion_to_euler_angles(values[pointer++],values[pointer++],values[pointer++],values[pointer]);
					let a;
					let progress = (animationInfo.time - keyframes[kfa])/(keyframes[kfb]-keyframes[kfa]);
					switch(channels.rotation.interpolation){
						case "LINEAR":
							a = __ANIMATION_HELPERS.slerp(kfda[0],kfda[1],kfda[2], kfdb[0],kfdb[1],kfdb[2], progress);
							break;
						case "STEP":
							a = __ANIMATION_HELPERS.step(kfda[0],kfda[1],kfda[2], kfdb[0],kfdb[1],kfdb[2], progress);
							break;
						case "CUBICSPLINE":
							console.error("Cubic interpolation is not supported yet");
							break;
						default:
							console.error("Unknown value: ", animation.interpolation);
							break;
					}
					adjustment.rotation[0] += a[0];
					adjustment.rotation[1] += a[1];
					adjustment.rotation[2] += a[2];
				}
			}
		}

		return adjustment;
	}

}