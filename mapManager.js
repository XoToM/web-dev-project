const VOXELMAP_CACHE_SIZE = [16, 16, 16];			//	dimensions of the voxelmap brick cache (in bricks)
let BRICKGRID_SIZE = [64, 64, 64];


//	Use to transfer data to gpu ->	gl.texSubImage3D(gl.TEXTURE_3D, 0, ox, oy, oz, width, height, depth, gl.RGBA, gl.UNSIGNED_BYTE, data);

class Brickmap {
	data = null;
	constructor(){
		this.data = new Uint8Array(8*8);	//	Allocate space for just the voxel bit mask.		ToDo: Add colors
		for(let i = 0; i < this.data.length; i++){
			this.data[i] = 0;
		}
	}
	setVoxelEmpty(lx, ly, lz){
		let mask = 1 << ly;
		data[lz*8+lx] &= ~mask;
	}
	setVoxelColor(lx, ly, lz, r, g, b){
		let mask = 1 << ly;
		data[lz*8+lx] |= mask;				//	Colors currently not supported. 	ToDo: Add colors
	}
	checkIsAllEmpty(){
		for(let i=0;i<8*8;i++){
			if(this.data[i] != 0) return false;
		}
		return true;
	}
	checkIsAllSolid(){
		for(let i=0;i<8*8;i++){
			if(this.data[i] != 255) return false;
		}
		return true;
	}
}

class BrickGrid {
	brickgrid = null;
	allocIndex = 0;

	constructor(){
		let rawData = [];
		let bufferSize = VOXELMAP_CACHE_SIZE[0]*VOXELMAP_CACHE_SIZE[1]*VOXELMAP_CACHE_SIZE[2] * 8 * 8 * 8 * 4;
		for(let i=0;i<bufferSize;i++){
			rawData.push(0);
		}

		this.voxelMap = twgl.createTexture(gl, {
			target: gl.TEXTURE_3D,
			width: VOXELMAP_CACHE_SIZE[0],
			height: VOXELMAP_CACHE_SIZE[1],
			depth: VOXELMAP_CACHE_SIZE[2],
			wrap: gl.REPEAT,
			minMag: gl.NEAREST,
			src: new Uint8Array(rawData),
			format: gl.RGBA_INTEGER,
			internalFormat: gl.R32I
		});
		gl.bindTexture(gl.TEXTURE_3D, this.voxelMap);



		let origin = this.allocBrick();	//	origin brick should always be at 0,0,0
		this.uploadBrick(origin, generateMap(this, 0, 0, 0));
	}
	allocBrick(){
		let brick_pos = [
			this.allocIndex % (VOXELMAP_CACHE_SIZE[0]),
			Math.floor(this.allocIndex / (VOXELMAP_CACHE_SIZE[0])) % VOXELMAP_CACHE_SIZE[1],
			Math.floor((this.allocIndex / (VOXELMAP_CACHE_SIZE[0])) / (VOXELMAP_CACHE_SIZE[1])) 	//	This is a very basic allocator, it can't deallocate bricks yet. If we ever reach a point at which this overflows we might as well let it crash the program.
		];
		this.allocIndex++;
		return brick_pos;
	}
	uploadBrick(brickPos, data){
		gl.bindTexture(gl.TEXTURE_3D, this.voxelMap);
		gl.texSubImage3D(gl.TEXTURE_3D, 0, brickPos[0], brickPos[1], brickPos[2], 1, 1, 1, gl.RGBA_INTEGER, gl.INT, data.data);
	}

}
function generationFunction(x, y, z){		//	Basic world generation function to create an rgb sphere out of voxels
	let tx = x-BRICKGRID_SIZE[0]/2;
	let ty = y-BRICKGRID_SIZE[1]/2;
	let tz = z-BRICKGRID_SIZE[2]/2;

	if(tx*tx+ty*ty+tz*tz>300) return [0,0,0,0];	//	RGB Sphere
	//if((tx+ty+tz)%2 == 0) return [0,0,0,0];	//	RGB Checkerboard cube

	let r = Math.floor(x / BRICKGRID_SIZE[0] * 256);
	let g = Math.floor(y / BRICKGRID_SIZE[1] * 256);
	let b = Math.floor(z / BRICKGRID_SIZE[2] * 256);
	return [r,g,b,1]
}
function generateMap(vmap, x, y, z, depth){
	if(!depth){
		toplevel = true;
		let mdepth = Math.max(...BRICKGRID_SIZE);
		depth = 0;
		while(mdepth > 1){
			depth++;
			mdepth /= 8;
		}
	}
	[x,y,z] = [x*8, y*8, z*8];
	let brick = new TmpBrick();
	for(let lz=0; lz<8; lz++){
		for(let ly=0; ly<8; ly++){
			for(let lx=0; lx<8; lx++){
				if(x+lx >= BRICKGRID_SIZE[0] || y+ly >= BRICKGRID_SIZE[1] || z+lz >= BRICKGRID_SIZE[2])	{
					brick.setVoxelEmpty(lx, ly, lz);
					continue;
				}

				if(depth<=1){
					//brick.setVoxelDebug(lx,ly,lz);continue;
					let voxel = generationFunction(x+lx, y+ly, z+lz);
					if(voxel[3]==1){
						brick.setVoxelColor(lx,ly,lz, voxel[0], voxel[1], voxel[2]);
					}else{
						brick.setVoxelEmpty(lx,ly,lz);
					}
				}else{
					let b = generateMap(vmap, x+lx, y+ly, z+lz, depth-1);
					if(b.checkIsAllEmpty()){
						brick.setVoxelEmpty(lx,ly,lz);
					}else{
						let location = vmap.allocBrick();
						vmap.uploadBrick(location, b);
						brick.setVoxelPointer(lx,ly,lz, location);
					}
				}
			}
		}
	}
	return brick;
}