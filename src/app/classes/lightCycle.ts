import {GroupedInstance} from './groupedInstance';
import {Mesh, TransformNode} from '@babylonjs/core/Meshes';
import {
  FresnelParameters,
  Material,
  MultiMaterial,
  PBRMaterial,
  ReflectionProbe,
  Scene,
  StandardMaterial
} from '@babylonjs/core';

export class LightCycle {

  groupedInstance: GroupedInstance;
  reflectionProbe: ReflectionProbe = new ReflectionProbe("main", 512, this.scene);
  transformNode: TransformNode;


  constructor(public meshes: Mesh[], public name: string, public scene: Scene) {
    this.groupedInstance = new GroupedInstance(meshes, 'lightCycle_'+name);

    this.transformNode = this.groupedInstance.transformNode;

    // @ts-ignore
    // this.reflectionProbe.renderList.push(this.reflectionList[0]);

    this.reflectionProbe.attachToMesh(this.groupedInstance.meshes[0]);
    this.setReflectionProbe();


    // this.groupedInstance.meshes.forEach(mesh => {
    //   console.log(mesh.name);
    //   // console.log(mesh.ma);
    // })

  }

  setReflectionProbe() {

    this.groupedInstance.meshes.forEach(mesh => {

      if (mesh.material != null && mesh.material.id == 'steel') {
      // if (mesh.material != null) {

        console.log(mesh.material);

        const mat = mesh.material as PBRMaterial;
        mat.reflectionTexture = this.reflectionProbe.cubeTexture;
        mat.realTimeFiltering = true;
        // mat.reflectionFresnelParameters = new FresnelParameters();
        // mat.reflectionFresnelParameters.bias = 0.02;

        console.log(mat);

        mesh.material = mat;
      }

      if (mesh.material != null && mesh.material.id == 'gloss') {
        // if (mesh.material != null) {

        console.log(mesh.material);

        const mat = mesh.material as PBRMaterial;
        mat.reflectionTexture = this.reflectionProbe.cubeTexture;
        mat.realTimeFiltering = true;
        mat.roughness = 0.0;
        mat.metallic = 1.0;
        // mat.reflectionFresnelParameters = new FresnelParameters();
        // mat.reflectionFresnelParameters.bias = 0.02;

        console.log(mat);

        mesh.material = mat;
      }
    });





    // const bikeMultiMat = this.meshes[0].material as MultiMaterial;
    // const personMat = this.meshes[1].material as PBRMaterial;
    // const circleMultiMat = this.meshes[2].material as MultiMaterial;
    //
    // console.log(bikeMultiMat);

    // if (bikeMultiMat.subMaterials != null) {
    //   bikeMultiMat.subMaterials.forEach((subM: PBRMaterial) => {
    //     if (subM.id == 'gloss') {
    //
    //     }
    //   });
    // }



  }
}
