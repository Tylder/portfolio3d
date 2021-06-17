import {ISceneLoaderAsyncResult} from '@babylonjs/core/Loading/sceneLoader';
import {Matrix, Quaternion, Vector2, Vector3} from '@babylonjs/core/Maths';
import {Mesh, MeshBuilder} from '@babylonjs/core/Meshes';

export class BlockFloor {


  bufferMatrices: Float32Array;

  instances: any;

  blockLights: Mesh;

  floorSize: {x: number, z: number};

  rotation = Quaternion.Identity();

  animationPosOffset: number = 0;
  maxAnimationPosOffset: number;

  constructor(public meshes: Mesh[], public scale: Vector3, public width: number, public y: number) {

    // meshes[0].dispose();

    this.maxAnimationPosOffset = this.width;

    this.blockLights = meshes[2];

    meshes[1].dispose();  // the fill bit..looks cooler without it

    this.meshes.forEach(mesh => {
      mesh.setParent(null);
      mesh.scaling = this.scale;
    })
  }

  createFloor(size: {x: number, z: number}) {

    this.floorSize = size;


    this.bufferMatrices = new Float32Array(16 * (size.x * size.z));

    let bufferOffset = 0;

    for (let x = 0; x < size.x; x++) {
      for (let z = 0; z < size.z; z++) {
        // positions.push(new Vector3(x*this.width, this.y, z*this.width));

        const pos = Matrix.Translation(x*this.width, this.y, z*this.width);
        pos.copyToArray(this.bufferMatrices, bufferOffset);

        // const pos = new Vector3(x*this.width, this.y, z*this.width);
        // this.matrices.push( Matrix.Compose(this.scale, rotation, pos) );
        bufferOffset += 16;
      }
    }

    this.blockLights.thinInstanceSetBuffer("matrix", this.bufferMatrices, 16, false);
    // this.meshes[1].thinInstanceSetBuffer("matrix", bufferMatrices, 16, false);

    // console.log(this.matrices);
    //
    // this.instances = this.meshes[1].thinInstanceAdd(this.matrices, false);
    //
    // console.log(this.instances);
  }

  updateFloorPosition(speed: number) {

    this.animationPosOffset += speed;
    this.animationPosOffset = this.animationPosOffset <= this.maxAnimationPosOffset ? this.animationPosOffset : 0;

    let bufferOffset = 0;

    for (let x = 0; x < this.floorSize.x; x++) {
      for (let z = 0; z < this.floorSize.z; z++) {

        const pos = Matrix.Translation(x*this.width+this.animationPosOffset, this.y, z*this.width);
        pos.copyToArray(this.bufferMatrices, bufferOffset);


        bufferOffset += 16;
      }
    }

    this.blockLights.thinInstanceSetBuffer("matrix", this.bufferMatrices, 16, false);
  }
    //
    //
    //     // const groupedInstance = new GroupedInstance(this.tronCubeMeshes, 'cube_' + x + '_' + z);
    //     // const groupedInstance = new GroupedThinInstance(this.tronCubeMeshes, 'cube_' + x + '_' + z);
    //     // groupedInstance.transformNode.scaling = this.scale;
    //     // groupedInstance.transformNode.setAbsolutePosition(new Vector3(x*this.width, 0, z*this.width));
    //     // this.instances.push(groupedInstance);
    //   }
    // }

  createInstance() {

  }
}
