const v3 = twgl.v3;

class Object3{
	position = v3.create(0,0,0);
	rotation = v3.create(0,0,0);
	scaling = v3.create(0,0,0);

	children = [];
	parent = null;
	name = null;

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
	calculateMatrix(parent){
		let matrix = m4.identity();
		m4.translate(matrix, this.position, matrix);
		m4.rotateZ(matrix, this.rotation[1] * (Math.PI/180), matrix);
		m4.rotateX(matrix, this.rotation[0] * (Math.PI/180), matrix);
		m4.scaling(matrix, this.scaling, matrix);
		m4.multiply(parent, matrix, matrix);
		return cameraMatrix;
	}
}