import {Mesh, InstancedMesh, TransformNode} from '@babylonjs/core/Meshes';
import {Matrix} from '@babylonjs/core/Maths';

export class GroupedThinInstance {

  name: string;
  // meshes: Mesh[];
  instances: InstancedMesh[] = [];
  transformNode: TransformNode;

  constructor(meshes: Mesh[], name: string, matrix: Matrix) {

    // this.meshes = meshes;
    this.name = name;

    this.transformNode = new TransformNode(name);

    meshes.forEach(mesh => {
      if (mesh.geometry != null) {
        // mesh.thinInstanceAdd()
        // const instance = mesh.createInstance(mesh.name + '_' + name);
        // instance.setParent(this.transformNode);
        // this.instances.push(instance);
      }
    })

  }
}
