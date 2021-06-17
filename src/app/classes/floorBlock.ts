import {Matrix, Quaternion, Vector3} from '@babylonjs/core/Maths';

export class FloorBlock {
  // var t = Math.cos(i * 123.1561) * 100.0;
  // var factor = 20.0 + Math.cos(i * 123.1561) * 100.0;
  // var speed = 0.01 + Math.cos(i * 123.1561) / 200.0;
  // var xFactor = -50.0 + Math.cos(i * 123.1561) * 100.0;
  // var yFactor = -50.0 + Math.cos(i * 123.1561) * 100.0;
  // var zFactor = -50.0 + Math.cos(i * 123.1561) * 100.0;
  // var data = {t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0, mat: new BABYLON.Matrix(), quat: new BABYLON.Quaternion(), pos: new BABYLON.Vector3()}

  matrix: Matrix = new Matrix();
  quat: Quaternion = new Quaternion();
  pos: Vector3 = new Vector3();

}
