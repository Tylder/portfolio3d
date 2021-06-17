import {Mesh, InstancedMesh, TransformNode} from '@babylonjs/core/Meshes';

export class GroupedInstance {

  name: string;
  meshes: Mesh[];
  instances: InstancedMesh[] = [];
  transformNode: TransformNode;

  constructor(meshes: Mesh[], name: string, ) {

    this.meshes = meshes;
    this.name = name;

    this.transformNode = new TransformNode(name);

    meshes.forEach(mesh => {
      if (mesh.geometry != null) {
        const instance = mesh.createInstance(mesh.name + '_' + name);
        instance.setParent(this.transformNode);
        this.instances.push(instance);
      }
    })

  }
}
