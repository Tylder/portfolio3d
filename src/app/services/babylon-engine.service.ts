import {ElementRef, Injectable, NgZone} from '@angular/core';
import {Engine} from '@babylonjs/core/Engines/engine';
import {Scene} from '@babylonjs/core/scene';
import {ArcRotateCamera, FreeCamera} from '@babylonjs/core/Cameras';
import {HemisphericLight, Light} from '@babylonjs/core/Lights';
import {Mesh, MeshBuilder} from '@babylonjs/core/Meshes';
import {Color3, Color4, Vector3} from '@babylonjs/core/Maths/math';
import {StandardMaterial} from '@babylonjs/core/Materials';
import {DynamicTexture} from '@babylonjs/core/Materials/Textures';


@Injectable({
  providedIn: 'root'
})
export class BabylonEngineService {

  // store the vars
  protected engine: Engine;
  protected canvas: HTMLCanvasElement;
  scene: Scene;

  constructor(private readonly ngZone: NgZone, private document: Document) { }

}
