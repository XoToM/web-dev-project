const VOXELMAP_CACHE_SIZE = [16, 16, 16];			//	dimensions of the voxelmap brick cache (in bricks)
const VOXELMAP_WORLD_SIZE = [64, 64, 64];


//	Use to transfer data to gpu ->	gl.texSubImage3D(gl.TEXTURE_3D, 0, ox, oy, oz, width, height, depth, gl.RGBA, gl.UNSIGNED_BYTE, data);

class TmpBrick {
	data = null;
	constructor(){
		this.data = new Uint8Array(8*8*8*4);
		for(let i = 0; i < this.data.length; i++){
			this.data[i] = 0;
		}
	}
	setVoxelEmpty(lx, ly, lz){
		let pointer = 8*8*lz + 8*ly + lx;
		pointer = pointer*4;
		data[pointer++] = 0;
		data[pointer++] = 0;
		data[pointer++] = 0;
		data[pointer++] = 0;
	}
	setVoxelColor(lx, ly, lz, r, g, b){
		let pointer = 8*8*lz + 8*ly + lx;
		pointer = pointer*4;
		data[pointer++] = r;
		data[pointer++] = g;
		data[pointer++] = b;
		data[pointer++] = 1;
	}
	setVoxelPointer(lx, ly, lz, brickPos){
		let pointer = 8*8*lz + 8*ly + lx;
		pointer = pointer*4;
		data[pointer++] = brickPos[0];
		data[pointer++] = brickPos[1];
		data[pointer++] = brickPos[2];
		data[pointer++] = 2;
	}
	setVoxelRaw(lx, ly, lz, data){
		let pointer = 8*8*lz + 8*ly + lx;
		pointer = pointer*4;
		data[pointer++] = data[0];
		data[pointer++] = data[1];
		data[pointer++] = data[2];
		data[pointer++] = data[3];
	}
	checkIsAllEmpty(){
		for(let i=0;i<8*8*8;i++){
			if(this.data[4*i+3] != 0) return false;
		}
		return true;
	}
	checkIsAllSolid(){
		for(let i=0;i<8*8*8;i++){
			if(this.data[4*i+3] != 1) return false;
		}
		return true;
	}
}

class VoxelMap {
	voxelMap = null;
	allocIndex = 0;

	constructor(){
		this.voxelMap = twgl.createTexture(gl, {
			target: gl.TEXTURE_3D,
			width: VOXELMAP_DIMENSIONS[0]*8,
			height: VOXELMAP_DIMENSIONS[1]*8,
			depth: VOXELMAP_DIMENSIONS[2]*8,
			wrap: gl.REPEAT,
			minMag: gl.NEAREST,
		});
		gl.bindTexture(gl.TEXTURE_3D, voxelMap);
		this.allocateBrick();	//	origin brick should always be at 0,0,0

	}
	allocateBrick(){
		let brick_pos = [
			allocIndex % (VOXELMAP_CACHE_SIZE[0]),
			allocIndex % (VOXELMAP_CACHE_SIZE[0] * VOXELMAP_CACHE_SIZE[1]),
			allocIndex 	//	This is a very basic allocator, it can't deallocate bricks yet. If we ever reach a point at which this overflows we might as well let it crash the program.
		];
		this.allocIndex++;
		return brick_pos;
	}
	uploadBrick(brickPos, data){

	}

}
function generationFunction(x, y, z){		//	Basic world generation function to create an rgb sphere out of voxels
	let tx = x-VOXELMAP_WORLD_SIZE[0]/2;
	let ty = y-VOXELMAP_WORLD_SIZE[1]/2;
	let tz = z-VOXELMAP_WORLD_SIZE[2]/2;

	if(tx*tx+ty*ty+tz*tz>5)return [0,0,0,0];

	let r = Math.floor(x / VOXELMAP_WORLD_SIZE[0] * 256);
	let g = Math.floor(y / VOXELMAP_WORLD_SIZE[1] * 256);
	let b = Math.floor(z / VOXELMAP_WORLD_SIZE[2] * 256);
	return [r,g,b,1]
}