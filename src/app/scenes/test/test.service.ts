import {ElementRef, Injectable} from '@angular/core';
import {BabylonEngineService} from '../../services/babylon-engine.service';
import {Scene} from '@babylonjs/core/scene';
import {ArcRotateCamera, FreeCamera} from '@babylonjs/core/Cameras';
import {HemisphericLight, Light, PointLight} from '@babylonjs/core/Lights';
import {Mesh, MeshBuilder} from '@babylonjs/core/Meshes';
import {Color3, Color4, Vector3} from '@babylonjs/core/Maths/math';
import {StandardMaterial} from '@babylonjs/core/Materials';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures';

@Injectable({
  providedIn: 'root'
})
export class TestService {

  protected camera: FreeCamera | ArcRotateCamera;
  protected light: Light;
  sun: Mesh;


  constructor() {

  }


}
