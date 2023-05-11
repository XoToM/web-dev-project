const v3 = twgl.v3;

class Object3{
	position = v3.create(0,0,0);
	rotation = v3.create(0,0,0);
	scaling = v3.create(1,1,1);

	children = [];
	parent = null;
	name = null;
	animationPlayer = null;
	renderVisibility = true;

	constructor({position = null, rotation = null, scaling = null, name = null}={}){
		if(position){
			this.position[0] = position[0] || this.position[0];
			this.position[1] = position[1] || this.position[1];
			this.position[2] = position[2] || this.position[2];
		}
		if(rotation){
			this.rotation[0] = rotation[0] || this.rotation[0];
			this.rotation[1] = rotation[1] || this.rotation[1];
			this.rotation[2] = rotation[2] || this.rotation[2];
		}
		if(scaling){
			this.scaling[0] = scaling[0] || this.scaling[0];
			this.scaling[1] = scaling[1] || this.scaling[1];
			this.scaling[2] = scaling[2] || this.scaling[2];
		}
		this.name = name;
	}

	appendChild(child){
		if(child instanceof Object3){
			if(child.parent) child.parent.removeChild(child);
			child.parent = this;
			this.children.push(child);
			if(child.onChildAdded) child.onChildAdded(this);
		}
	}

	removeChild(child) {
		if(child instanceof Object3){
			child.parent = null;
			if(child.onChildRemoved) child.onChildRemoved(this);
		}
		for(let i=0; i<this.children.length; i++){
			if(this.children[i] === child){
				let popped = this.children.pop();
				if(i !== this.children.length) {
					this.children[i] = popped;
				}
				return;
			}
		}
	}
	getChildWithName(name){
		return this.children.find((c)=>(c.name == name));
	}
	getAnyChildWithName(name){
		let childDepth = Infinity;
		function getChildByNameRec(obj, depth){
			let result = obj.getChildWithName(name);
			if(result) {
				childDepth = depth;
				return result;
			}
			if(childDepth > depth){
				for(let child of obj.children){
					result = getChildByNameRec(child, depth + 1);
					if(result) return result;
				}
			}
			return null;
		}
		return getChildByNameRec(this, 0);
	}
	calculateMatrix(parent, adjustment){
		if(!adjustment) adjustment = {};
		let matrix = m4.identity();
		let vector = v3.copy(this.position);
		if(adjustment.position){
			vector[0] += adjustment.position[0];
			vector[1] += adjustment.position[1];
			vector[2] += adjustment.position[2];
		}
		m4.translate(matrix, vector, matrix);

		v3.copy(this.rotation, vector);
		vector[0] *= (Math.PI/180);
		vector[1] *= (Math.PI/180);
		vector[2] *= (Math.PI/180);
		
		m4.rotateZ(matrix, vector[2], matrix);
		m4.rotateY(matrix, vector[1], matrix);
		m4.rotateX(matrix, vector[0], matrix);

		if(adjustment.rotation){
			//vector[0] += adjustment.rotation[0];
			//vector[1] += adjustment.rotation[1];
			//vector[2] += adjustment.rotation[2];
			m4.multiply(matrix,adjustment.rotation,matrix);
		}

		v3.copy(this.scaling, vector);
		if(adjustment.scale){
			vector[0] *= adjustment.scale[0];
			vector[1] *= adjustment.scale[1];
			vector[2] *= adjustment.scale[2];
		}
		m4.scale(matrix, vector, matrix);
		m4.multiply(parent, matrix, matrix);
		return matrix;
	}
	//onChildAdded = null;
	//onChildRemoved = null;
}