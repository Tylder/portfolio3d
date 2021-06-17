import {Mesh, Scene, TransformNode, UniversalCamera, Vector3} from '@babylonjs/core';

export class CameraController {

//root camera parent that handles positioning of the camera to follow the player
//   camRoot: TransformNode = new TransformNode("root");
//   camRoot: TransformNode;

  //rotations along the x-axis (up/down tilting)
  yTilt = new TransformNode("ytilt");

  camera: UniversalCamera;
  root: TransformNode;

  constructor(private scene: Scene) {
    //our actual camera that's pointing at our root's position
    this.camera = new UniversalCamera("cam", new Vector3(70, 10, -20), this.scene);
    scene.activeCamera = this.camera;
  }

  setRoot(root: TransformNode) {
    this.root = root;

    //
    // this.root.position = new Vector3(0, 0, 0); //initialized at (0,0,0)
    // //to face the player from behind (180 degrees)
    // this.root.rotation = new Vector3(0, Math.PI, 0);

    //adjustments to camera view to point down at our player
    this.yTilt.rotation = new Vector3(0, 0, 0);
    this.yTilt.parent = this.root;

    this.camera.lockedTarget = this.root.position;
    this.camera.fov = 0.45;
    this.camera.parent = this.yTilt;
  }

}
