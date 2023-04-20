const VOXELMAP_CACHE_SIZE = [16, 16, 16];			//	dimensions of the voxelmap brick cache (in bricks)
const VOXELMAP_WORLD_SIZE = [64, 64, 64];


//	Use to transfer data to gpu ->	gl.texSubImage3D(gl.TEXTURE_3D, 0, ox, oy, oz, width, height, depth, gl.RGBA, gl.UNSIGNED_BYTE, data);


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