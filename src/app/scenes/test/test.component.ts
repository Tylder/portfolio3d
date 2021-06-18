import {Component, ElementRef, Inject, NgZone, OnInit, ViewChild} from '@angular/core';
import {TestService} from './test.service';
import {
  ArcRotateCamera, Color3, Constants, DynamicTexture,
  Engine,
  FreeCamera, GlowLayer, HDRCubeTexture,
  HemisphericLight, InstancedMesh,
  Light, Mesh,
  MeshBuilder, MirrorTexture, PBRMaterial, Plane, ReflectionProbe,
  Scene, SceneLoader, StandardMaterial, UniversalCamera,
  Vector3
} from '@babylonjs/core';

import "@babylonjs/loaders";


import {DOCUMENT} from '@angular/common';
import {AbstractMesh} from '@babylonjs/core/Meshes/abstractMesh';
import {fromPromise} from 'rxjs/internal-compatibility';
import {forkJoin, Observable} from 'rxjs';
import {map, take, tap} from 'rxjs/operators';
import {ISceneLoaderAsyncResult} from '@babylonjs/core/Loading/sceneLoader';
import {GroupedInstance} from '../../classes/groupedInstance';
import {BlockFloor} from '../../classes/blockFloor';
import {Matrix} from '@babylonjs/core/Maths';
import {LightCycle} from '../../classes/lightCycle';
import {CameraController} from '../../classes/cameraController';

@Component({
  selector: 'app-test',
  templateUrl: './test.component.html',
  styleUrls: ['./test.component.scss'],
  providers: [TestService]
})
export class TestComponent implements OnInit {

  @ViewChild('rCanvas', {static: true})
  canvasRef: ElementRef<HTMLCanvasElement>;

  protected engine: Engine;
  protected canvas: HTMLCanvasElement;
  // protected camera: ArcRotateCamera;
  protected camera: FreeCamera;
  protected cameraCtrl: CameraController;
  protected light: Light;

  scene: Scene;
  tronCycle1Root: Mesh;
  tronCycle1TMeshes: Mesh[];
  tronCubeRoot: Mesh;
  tronCubeMeshes: Mesh[];

  tronCubeInstances: InstancedMesh[];

  // blockGroupedInstance: GroupedInstance;
  lightCycle: LightCycle;

  floor: BlockFloor;

  metalMat: PBRMaterial;
  lightMat: PBRMaterial;

  env: any;

  constructor(@Inject(DOCUMENT) readonly doc: Document, private readonly ngZone: NgZone) {


    // this.lightMat = new PBRMaterial('light', this.scene);
    // this.lightMat.emissiveColor = new Color3(0.8, 0, 0);
  }

  ngOnInit(): void {

    this.createScene(this.canvasRef);

    this.start(true);
  }

  initScene() {


  }

  loadMeshes$(): Observable<{[key: string]: Mesh[]}> {
    // const tronCycleLoadPromise = SceneLoader.ImportMeshAsync('', 'assets/gltf/', 'Tron Light cycle3.gltf', this.scene).then((result => {
    //   console.log(result);
    //   lightCycle = result.meshes[0];
    //   lightCycle.position.x = 20;
    // }));

    const tronCycleLoadObs$ = fromPromise(
      // SceneLoader.ImportMeshAsync('', 'assets/gltf/', 'Tron Light cycle3.gltf', this.scene)
      SceneLoader.ImportMeshAsync('', 'assets/gltf/', 'Tron Light cycle4.gltf', this.scene)
    ).pipe(
      map(res => res.meshes as Mesh[])
    );


    const tronBlockLoadObs$ = fromPromise(
      SceneLoader.ImportMeshAsync('', 'assets/gltf/', 'tron cube8.gltf', this.scene)
    ).pipe(
      tap(res => console.log(res)),
      map(res => res.meshes as Mesh[])
    );

    return forkJoin({tronCycleMeshes: tronCycleLoadObs$, tronBlockMeshes: tronBlockLoadObs$}).pipe();
  }

  createScene(canvas: ElementRef<HTMLCanvasElement>): Scene {
    this.canvas = canvas.nativeElement;
    this.canvas.style.height = '100%';
    this.canvas.style.width = '100%';
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    /* HDRI */
    // this.env = this.scene.createDefaultEnvironment({
    //   environmentTexture: "assets/env/BROADWAY_LAFAYETTE_STATION_2_2.env",
    //   skyboxSize: 10000,
    //   skyboxTexture: "assets/env/BROADWAY_LAFAYETTE_STATION_2_2.env",
    //   // skyboxColor: Color3.Black(),
    //   groundColor: Color3.Black()
    // });

    this.env = this.scene.createDefaultEnvironment({
      environmentTexture: "assets/env/53RD_STREET.env",
      skyboxSize: 10000,
      // skyboxTexture: "assets/env/53RD_STREET.env",
      skyboxColor: Color3.Black(),
      groundColor: Color3.Black(),
      // enableGroundShadow: true
    });

    this.scene.ambientColor = new Color3(0.0, 0.0, 0.0);



    // this.scene.fogMode = Scene.FOGMODE_LINEAR;
    // this.scene.fogColor = new Color3(0.0, 0.0, 0.0);
    // this.scene.fogDensity = 0.1;

    // this.scene.fogStart = 20.0;
    // this.scene.fogEnd = 100.0;

    // this.env.

    // this.scene.createDefaultSkybox("assets/env/53RD_STREET.env");

    // this.env = this.scene.createDefaultEnvironment();

    // var reflectionTexture = new HDRCubeTexture("assets/env/BROADWAY_LAFAYETTE_STATION_2.hdr", this.scene, 128, false, true, false, true);

    /* CAMERA AND BASE LIGHT */
    // this.cameraCtrl = new CameraController(this.scene);
    this.camera = new UniversalCamera("cam", new Vector3(70, 10, -20), this.scene);
    // this.cameraCtrl.camera.attachControl(this.canvas, true);
    // this.camera = new ArcRotateCamera("camera", -Math.PI + ((Math.PI/10)*0.45), (Math.PI/2) - ((Math.PI/10)*0.2), 145, new Vector3(0, 0, 20), this.scene);
    // this.camera = new FreeCamera("camera", new Vector3(-140, 0, 0),  this.scene);
    this.camera.attachControl(this.canvas, true);
    //
    // const light = new HemisphericLight("light", new Vector3(0, 1, 0), this.scene);
    // light.intensity = 0.1;



    // var matrix1 = Matrix.Translation(-2, 2, 0);
    // var matrix2 = Matrix.IdentityReadOnly;
    // var matrix3 = Matrix.Translation(2, 1, 0);
    //
    // var bufferMatrices = new Float32Array(16 * 3);
    //
    // matrix1.copyToArray(bufferMatrices, 0);
    // matrix2.copyToArray(bufferMatrices, 16);
    // matrix3.copyToArray(bufferMatrices, 32);
    //
    // var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, this.scene);
    // const sphereMat = new PBRMaterial('metal', this.scene);
    // // sphereMat.reflectionTexture = probe.cubeTexture;
    // sphereMat.roughness = 0.2;
    // sphereMat.metallic = 1.0;
    // sphere.material = sphereMat;
    // sphere.thinInstanceSetBuffer("matrix", bufferMatrices, 16, false);

    // return this.scene;

    this.loadMeshes$().pipe(
      take(1)
    ).subscribe(({tronCycleMeshes, tronBlockMeshes}) => {
      console.log(tronCycleMeshes);
      console.log(tronBlockMeshes);

      // tronCycle.meshes.forEach(mesh => {
      //   mesh.position.x = -250;
      //   mesh.position.z = 0;
      // });

      this.floor = new BlockFloor(tronBlockMeshes, new Vector3(1, 1, 1), 3, 0);
      this.floor.createFloor({x:50, z:4});


      // const tronCycleMesh1 = tronCycle.meshes[1] as Mesh;

      // if (tronCycleMesh1.material != null) {
      //   tronCycleMesh1.material.reflectionTexture = new MirrorTexture("mirror", {ratio: 0.5}, scene, true);
      //   tronCycleMesh1.material.reflectionTexture.mirrorPlane = new Plane(0, -1.0, 0, -2.0);
      //   tronCycleMesh1.material.reflectionTexture.renderList = [knot];
      //   tronCycleMesh1.material.reflectionTexture.level = 1.0;
      // }



      // this.lightCycle = new GroupedInstance(tronCycle.meshes as Mesh[], 'cycle');
      this.lightCycle = new LightCycle(tronCycleMeshes, 'player', this.scene);

      // @ts-ignore
      // this.lightCycle.reflectionProbe.renderList.push(this.scene.sky);
      // this.lightCycle.reflectionProbe.renderList.push(this.floor.meshes[1]);


      // @ts-ignore
      this.lightCycle.reflectionProbe.renderList.push(this.env.skybox);
      // @ts-ignore
      this.lightCycle.reflectionProbe.renderList.push(this.floor.meshes[2]);


      // console.log(this.scene.materials);
      this.lightCycle.transformNode.position.x = -125;
      this.lightCycle.transformNode.position.z = -6;
      this.lightCycle.transformNode.position.y = 2;
      this.lightCycle.transformNode.rotation = new Vector3(0, Math.PI, 0);

      // this.cameraCtrl.camRoot = this.lightCycle.transformNode;

      // this.cameraCtrl.setRoot(this.lightCycle.transformNode);

      console.log(this.lightCycle.meshes);

      tronCycleMeshes.forEach((_m: Mesh) => {
        _m.isVisible = false;
      });

      //**/

      var probe = new ReflectionProbe("main", 256, this.scene);


      // var sphere = MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, this.scene);
      // const sphereMat = new PBRMaterial('metal', this.scene);
      // sphereMat.reflectionTexture = probe.cubeTexture;
      // sphereMat.roughness = 0.2;
      // sphereMat.metallic = 1.0;
      // sphereMat.realTimeFiltering = true;
      // sphereMat.realTimeFilteringQuality = Constants.TEXTURE_FILTERING_QUALITY_HIGH;
      //
      // sphere.material = sphereMat;
      //
      // sphere.position.x = -5;
      // sphere.position.y = 3;
      //
      // probe.attachToMesh(sphere);
      //
      // const skybox = this.env.skybox;
      //
      //
      // // @ts-ignore
      // probe.renderList.push(skybox);
      // // @ts-ignore
      // probe.renderList.push(sphere);
      // // @ts-ignore
      // probe.renderList.push(this.floor.meshes[2]);

      /**/


      this.scene.registerBeforeRender(() => {
        // mouseX = scene.pointerX - window.innerWidth * 0.5;
        // mouseY = scene.pointerY - window.innerHeight * 0.5;
        this.floor.updateFloorPosition(0.2);
        // console.log(this.camera.alpha);
        // console.log(this.camera.beta);
      })

      // this.blockGroupedInstance.transformNode.position.x = 20;
      // this.blockGroupedInstance.transformNode.setAbsolutePosition(new Vector3(-7, -2, 0));

      // const instance = this.tronCubeMeshes[1].createInstance('cube_instance');
      // const instance2 = this.tronCubeMeshes[2].createInstance('cube_instance2');
      // instance.position.x = 20;
      // instance2.position.x = 20;

      // this.tronCubeRoot.position.x = 20;
      // this.tronCubeRoot.isVisible = false;
      // this.createCubeInstances(this.tronCubeMeshes[1]);
      // console.log(this.tronCubeInstances);
    });




    // console.log(this.scene.getNodes());
    // console.log(this.scene.meshes);

    // const textPlane = this.makeTextPlane('test', 'white', 10);

    // const plane = this.createPlane();

    var gl = new GlowLayer("glow", this.scene, {
      mainTextureFixedSize: 2048,
      blurKernelSize: 256
    });


    // gl.customEmissiveColorSelector = function(mesh, subMesh, material, result) {
      // if (mesh.name === "TronCube_primitive1") {
      //   result.set(0.5, 0, 0.5, 1);
      // } else {
      //   result.set(0, 0.5, 0, 1);
      // }
    // };


    gl.intensity = 0.5;


    this.scene.registerBeforeRender(function () {

    });




    return this.scene;
  }

  createCubeInstances(mesh: Mesh) {

    console.log(mesh);
    // for (let x = 0; x < 1; x++) {
    //   for (let z = 0; z < 1; z++) {
    //     const instance = mesh.createInstance('cube_' + x + '_' + z);
    //     instance.position.x = x;
    //     instance.position.z = z;
    //
    //     this.tronCubeInstances.push(instance);
    //   }
    // }
  }

  createPlane(): Mesh {
    let myPaths = [
      [   new Vector3(0, 0, 0),
        new Vector3(0, 0, 25)
      ],
      [   new Vector3(25, 0, 0),
        new Vector3(25, 0, 25)
      ],
      [
        new Vector3(0, 25, 0),
        new Vector3(0, 25, 25)
      ],
      [
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 25)
      ]

    ];

    const plane = MeshBuilder.CreateRibbon("plane", {pathArray: myPaths, updatable: true}, this.scene);

    // @ts-ignore
    // plane.material.wireframe = true;

    // var materialPlane = new StandardMaterial("texturePlane", scene);
    // materialPlane.diffuseTexture = new Texture("textures/co.png", scene);
    // plane.material = materialPlane;

    return plane;
  }

  start(inZone = true): void {

    if (inZone) {
      this.ngZone.runOutsideAngular(() => {
        this.startTheEngine();
      });
    } else {
      this.startTheEngine();
    }
  }

  private startTheEngine() {
    let freshRender = true;
    const element = this.doc.getElementById('fpsLabel');

    this.engine.runRenderLoop(() => {
      this.scene.render();
      if (element) {
        element.innerHTML = this.engine.getFps().toFixed() + ' fps';
      }
      if (freshRender) {
        this.engine.resize();
        freshRender = false;
      }
    });
    window.addEventListener('resize', () => this.engine.resize());
  }

  makeTextPlane(text: string, color: string, textSize: number) {
    const dynamicTexture = new DynamicTexture('DynamicTexture', 512, this.scene, false);
    dynamicTexture.hasAlpha = true;
    dynamicTexture.drawText(text, 0, 50, 'bold 30px Arial', color, 'black', true);
    const plane = Mesh.CreatePlane('TextPlane', textSize, this.scene, true);
    const material = new StandardMaterial('TextPlaneMaterial', this.scene);
    material.backFaceCulling = false;
    material.specularColor = new Color3(0, 0, 0);
    material.diffuseTexture = dynamicTexture;
    plane.material = material;

    return plane;
  }

}
