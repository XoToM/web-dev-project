const v3 = twgl.v3;

class Object3{
	position = v3.create(0,0,0);
	rotation = v3.create(0,0,0);
	scaling = v3.create(1,1,1);

	children = [];
	parent = null;
	name = null;
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
		}
	}

	removeChild(child) {
		if(child instanceof Object3){
			child.parent = null;
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
	calculateMatrix(parent){
		let matrix = m4.identity();
		m4.translate(matrix, this.position, matrix);
		m4.rotateZ(matrix, this.rotation[2] * (Math.PI/180), matrix);
		m4.rotateY(matrix, this.rotation[1] * (Math.PI/180), matrix);
		m4.rotateX(matrix, this.rotation[0] * (Math.PI/180), matrix);
		m4.scale(matrix, [this.scaling[0], this.scaling[1], this.scaling[2]], matrix);
		m4.multiply(parent, matrix, matrix);
		return matrix;
	}
}