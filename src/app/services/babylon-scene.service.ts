import {ElementRef, Injectable, NgZone} from '@angular/core';
import {Observable} from 'rxjs';
import {DeviceDetectorService} from 'ngx-device-detector'; // seems to be a bug with babylonJs that requires UniversalCamera to be imported like this
import {SpotLight} from '@babylonjs/core/Lights';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows';
import {AbstractMesh, Mesh} from '@babylonjs/core/Meshes';
import {Color3} from '@babylonjs/core/Maths/math';
import {Material, PBRMetallicRoughnessMaterial, StandardMaterial, Texture} from '@babylonjs/core/Materials';
import {RenderTargetTexture, VideoTexture} from '@babylonjs/core/Materials/Textures';
import {Scene} from '@babylonjs/core/scene';
import {Engine} from '@babylonjs/core/Engines';
import {ReflectionProbe} from '@babylonjs/core/Probes';
import {SceneLoader} from '@babylonjs/core/Loading';
import {ActionEvent, ActionManager, ExecuteCodeAction} from '@babylonjs/core/Actions';

import {VideoTextureSettings} from '@babylonjs/core/Materials/Textures/videoTexture';

import {tap} from 'rxjs/operators';
import {CameraController} from '../classes/cameraController';
import {fromPromise} from 'rxjs/internal-compatibility';

import {UniversalCamera} from '@babylonjs/core/Cameras';
import '@babylonjs/core/Cameras/universalCamera';
import {GlowLayer} from '@babylonjs/core';

@Injectable({
  providedIn: 'root'
})
export class BabylonSceneService {

  engine: Engine;
  canvas: HTMLCanvasElement;
  // protected camera: ArcRotateCamera;
  camera: UniversalCamera;
  cameraCtrl: CameraController;

  // protected light: Light;
  // cameraCenterPos: Vector3;

  shadowGenerators: ShadowGenerator[] = [];

  windowReflectionProbe: ReflectionProbe;

  lightNamesWithUpdatingShadows: String[] = ['InnerLightCeilingFanShadow'];

  // window: ReflectionProbe;

  topTV: Mesh;
  middleTV: Mesh;
  bottomTV: Mesh;

  topTVCollision: Mesh;
  middleTVCollision: Mesh;
  bottomTVCollision: Mesh;

  env: any;
  scene: Scene;

  constructor(private deviceService: DeviceDetectorService) {}

  appendFromBabylonFile$(): Observable<any> {
    return fromPromise(
      SceneLoader.AppendAsync('assets/full_scene/', 'main.babylon', this.scene)
    ).pipe(
      // map(res => res.meshes as Mesh[])
    );
  }

  createScene$(canvas: ElementRef<HTMLCanvasElement>): Observable<Scene> {
    this.canvas = canvas.nativeElement;
    this.canvas.style.height = '100%';
    this.canvas.style.width = '100%';
    this.engine = new Engine(this.canvas, true);
    this.scene = new Scene(this.engine);

    this.windowReflectionProbe = new ReflectionProbe('window', 256, this.scene);

    // this.env = this.scene.createDefaultEnvironment({
    //   environmentTexture: "assets/env/53RD_STREET.env",
    //   skyboxSize: 10000,
    //   skyboxTexture: "assets/env/53RD_STREET.env",
    //
    //
    //   // skyboxColor: Color3.Black(),
    //   // groundColor: Color3.Black(),
    //   // enableGroundShadow: true
    // });



    /* READ 3D SOFTWARE EXPORTED BABYLON FILE, APPEND IT TO THE SCENE AND DO SOME WORK ON IT */
    return this.appendFromBabylonFile$().pipe(
      tap(res => console.log(res)),
      tap(scene => this.handleLoadedStaticBabylonFile(scene))
    );
  }

  handleLoadedStaticBabylonFile(scene: Scene): void{
    /* CAMERA */
    this.camera = scene.cameras[0] as UniversalCamera;
    // this.camera.attachControl(this.canvas, true);
    // this.cameraCenterPos = this.camera.position;



    /* MATERIAL MAX LIGHTS LIMIT INCREASE */
    scene.materials.forEach((mat: Material) => {
      // console.log(typeof mat);
      if (mat instanceof PBRMetallicRoughnessMaterial) {
        // console.log(mat);
        mat.maxSimultaneousLights = 6 // webGL device dependant error if set above 10
      }
    });

    /* FACADE MAT */
    // if not desktop use a lightmap to save performance
    // if ( !this.deviceService.isDesktop() ) {
    const facadeMat = scene.getMaterialByName('Facade') as PBRMetallicRoughnessMaterial;
    if (facadeMat != null) {
      const facadeLightMap = new Texture("assets/lightmaps/Facade_and_road_combined_lightmap_4k.jpg", scene);
      facadeMat.lightmapTexture = facadeLightMap;
      facadeMat.useLightmapAsShadowmap = true;
    }

    /* BACK WALL MAT */
    // if not desktop use a lightmap to save performance
    // if ( !this.deviceService.isDesktop() ) {
    const backwallMat = scene.getMaterialByName('backwall_mat') as PBRMetallicRoughnessMaterial;
    if (backwallMat != null) {
      const backwallLightMap = new Texture("assets/lightmaps/wall_backShape_lightmap_1k_2.jpg", scene);
      backwallMat.lightmapTexture = backwallLightMap;
      backwallMat.useLightmapAsShadowmap = false
    }
    // }

    /* GLASS MAT */
    const glassMat = scene.getMaterialByName('GlassMat') as PBRMetallicRoughnessMaterial;
    const glassNode: Mesh = scene.getNodeByName('GlassPane') as Mesh;

    glassNode.isPickable = false; // ignore glass
    // glassNode.dispose();
    // glassNode.isBlocked

    glassMat.baseColor = Color3.Black();
    glassMat.metallic = 0;

    glassMat.alpha = 0.5;

    const reflectionBG: AbstractMesh = scene.getNodeByName('reflectionBG') as AbstractMesh;
    const trashcan: AbstractMesh = scene.getNodeByName('trashcan_group') as AbstractMesh;
    const bench: AbstractMesh = scene.getNodeByName('bench') as AbstractMesh;

    if (this.windowReflectionProbe.renderList != null) {
      if (reflectionBG != null) { this.windowReflectionProbe.renderList.push(reflectionBG); }
      if (trashcan != null) {
        trashcan.getChildMeshes().forEach(mesh => {
          if (mesh != null && this.windowReflectionProbe.renderList != null) { this.windowReflectionProbe.renderList.push(mesh); }
        });
      }
      if (bench != null) { this.windowReflectionProbe.renderList.push(bench); }
    }

    glassMat.environmentTexture = this.windowReflectionProbe.cubeTexture;

    // const crossTheStreetLight: Light = scene.getNodeByName('CrossTheStreetLight') as Light;
    // crossTheStreetLight.intensity = 10;


    /* SHADOWS */
    /* Create SHADOW GENERATORS */
    scene.lights.forEach((light) => {
      if (light instanceof SpotLight) {
        // console.log(light);

        // lower res shadows for dynamic lights
        if( (this.lightNamesWithUpdatingShadows.includes(light.name)) ) {
          this.shadowGenerators.push(
            new ShadowGenerator(512, light)
          );
        } else {
          this.shadowGenerators.push(
            new ShadowGenerator(1024, light)
          );
        }

      }
    });
    /* ADD MESHES TO GENERATORS */
    this.scene.meshes.forEach(mesh => {

      // console.log(mesh);

      if (mesh instanceof Mesh) {
        mesh.receiveShadows = true;
      }

      this.shadowGenerators.forEach(gen => {
        gen.addShadowCaster(mesh);
      });
    });

    /* SOFT EDGES */
    this.shadowGenerators.forEach(gen => {
      gen.usePoissonSampling = true;
    });

    /* UPDATE JUST ONCE */
    this.shadowGenerators.forEach(gen => {
      if( !(this.lightNamesWithUpdatingShadows.includes(gen.getLight().name)) ) {
        gen!.getShadowMap()!.refreshRate = RenderTargetTexture.REFRESHRATE_RENDER_ONCE;
      }
    });




    /* TVs */
    this.topTV = scene.getNodeByName('TV2') as Mesh;
    this.middleTV = scene.getNodeByName('TV1') as Mesh;
    this.bottomTV = scene.getNodeByName('TV') as Mesh;

    this.topTVCollision = this.topTV.getChildMeshes(false, (node) => node.name === 'collision')[0] as Mesh;
    this.middleTVCollision = this.middleTV.getChildMeshes(false, (node) => node.name === 'collision')[0] as Mesh;
    this.bottomTVCollision = this.bottomTV.getChildMeshes(false, (node) => node.name === 'collision')[0] as Mesh;

    this.topTVCollision.visibility = 0;
    this.middleTVCollision.visibility = 0;
    this.bottomTVCollision.visibility = 0;

    const topTVScreen: Mesh = this.topTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;
    const middleTVScreen: Mesh = this.middleTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;
    const bottomTVScreen: Mesh = this.bottomTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;


    // const topTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenTopMat') as PBRMetallicRoughnessMaterial;
    // const middleTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenMiddleMat') as PBRMetallicRoughnessMaterial;
    // const bottomTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenBottomMat') as PBRMetallicRoughnessMaterial;


    // this.registerHover(bottomTV, this.onTVHover);

    // const topTVScreen: Mesh = topTV.getChildren((node) => node.name === 'kinescope')[0] as Mesh;

    const videoSettings: VideoTextureSettings = {
      autoPlay: true,
      loop: true,
      autoUpdateTexture: true,
      muted: true,
    }

    /* GITHUB */

    const githubVideoSources: string[] = [
      "assets/video/github/github.webm",
      // "assets/video/github/github.mp4",
    ];

    const githubMat = new StandardMaterial('githubMat', scene);
    githubMat.diffuseTexture = new VideoTexture(
      "githubTex", githubVideoSources, scene, false, false, 0, videoSettings);

    githubMat.emissiveColor = Color3.White();

    topTVScreen.material = githubMat;

    /* CONTACT ME */

    const contactMeVideoSources: string[] = [
      "assets/video/contact/contact_me.webm",
      "assets/video/contact/contact_me.mp4",
    ];

    const contactMat = new StandardMaterial('contactMat', scene);
    contactMat.diffuseTexture = new VideoTexture(
      "contactTex", contactMeVideoSources, scene, false, false, 0, videoSettings);

    contactMat.emissiveColor = Color3.White();

    middleTVScreen.material = contactMat;

    /* PROJECTS */

    const projectsVideoSources: string[] = [
      "assets/video/projects/project.webm",
      "assets/video/projects/project.mp4",
    ];

    const projectsMat = new StandardMaterial('projectsMat', scene);
    projectsMat.diffuseTexture = new VideoTexture(
      "projectsTex", projectsVideoSources, scene, false, false, 0, videoSettings);

    projectsMat.emissiveColor = Color3.White();
    bottomTVScreen.material = projectsMat;

    /* GLOW */
    var gl = new GlowLayer("glow", this.scene, {
      mainTextureFixedSize: 2048,
      blurKernelSize: 256
    });
    gl.intensity = 1;

    gl.addExcludedMesh(topTVScreen);
    gl.addExcludedMesh(middleTVScreen);
    gl.addExcludedMesh(bottomTVScreen);


  }

  /**
   * Change pointer to hand when hovering over mesh and trigger given function
   *
   * @param mesh
   * @param includeChildren
   * @param func
   */
  registerHover(mesh: Mesh, includeChildren: boolean, func: (evt: ActionEvent) => void) {

    if (includeChildren) {
      mesh.getChildMeshes(false).forEach(_mesh => {
        _mesh.isPickable = true;

        if (_mesh.actionManager == null) {
          _mesh.actionManager = new ActionManager(this.scene);
        }

        _mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOverTrigger,
            func
          )
        );

      });
    } else {
      mesh.isPickable = true;
      if (mesh.actionManager == null) {
        mesh.actionManager = new ActionManager(this.scene);
      }
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPointerOverTrigger,
          func
        )
      );
    }

  }

  /**
   * Change pointer to hand when hovering over mesh and trigger given function
   *
   * @param mesh
   * @param includeChildren
   * @param func
   */
  registerEndHover(mesh: Mesh, includeChildren: boolean, func: (evt: ActionEvent) => void) {
    if (includeChildren) {
      mesh.getChildMeshes(false).forEach(_mesh => {
        _mesh.isPickable = true;
        if (_mesh.actionManager == null) {
          _mesh.actionManager = new ActionManager(this.scene);
        }
        _mesh.actionManager.registerAction(
          new ExecuteCodeAction(
            ActionManager.OnPointerOutTrigger,
            func
          )
        );

      });
    } else {
      mesh.isPickable = true;
      if (mesh.actionManager == null) {
        mesh.actionManager = new ActionManager(this.scene);
      }
      mesh.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPointerOutTrigger,
          func
        )
      );
    }
  }

  // // show axis
  // showAxis(size: number): void {
  //   var makeTextPlane = function(text, color, size) {
  //     var dynamicTexture = new BABYLON.DynamicTexture("DynamicTexture", 50, scene, true);
  //     dynamicTexture.hasAlpha = true;
  //     dynamicTexture.drawText(text, 5, 40, "bold 36px Arial", color , "transparent", true);
  //     var plane = new BABYLON.Mesh.CreatePlane("TextPlane", size, scene, true);
  //     plane.material = new BABYLON.StandardMaterial("TextPlaneMaterial", scene);
  //     plane.material.backFaceCulling = false;
  //     plane.material.specularColor = new BABYLON.Color3(0, 0, 0);
  //     plane.material.diffuseTexture = dynamicTexture;
  //     return plane;
  //   };
  //
  //   var axisX = BABYLON.Mesh.CreateLines("axisX", [
  //     new BABYLON.Vector3.Zero(), new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, 0.05 * size, 0),
  //     new BABYLON.Vector3(size, 0, 0), new BABYLON.Vector3(size * 0.95, -0.05 * size, 0)
  //   ], scene);
  //   axisX.color = new BABYLON.Color3(1, 0, 0);
  //   var xChar = makeTextPlane("X", "red", size / 10);
  //   xChar.position = new BABYLON.Vector3(0.9 * size, -0.05 * size, 0);
  //   var axisY = BABYLON.Mesh.CreateLines("axisY", [
  //     new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( -0.05 * size, size * 0.95, 0),
  //     new BABYLON.Vector3(0, size, 0), new BABYLON.Vector3( 0.05 * size, size * 0.95, 0)
  //   ], scene);
  //   axisY.color = new BABYLON.Color3(0, 1, 0);
  //   var yChar = makeTextPlane("Y", "green", size / 10);
  //   yChar.position = new BABYLON.Vector3(0, 0.9 * size, -0.05 * size);
  //   var axisZ = BABYLON.Mesh.CreateLines("axisZ", [
  //     new BABYLON.Vector3.Zero(), new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0 , -0.05 * size, size * 0.95),
  //     new BABYLON.Vector3(0, 0, size), new BABYLON.Vector3( 0, 0.05 * size, size * 0.95)
  //   ], scene);
  //   axisZ.color = new BABYLON.Color3(0, 0, 1);
  //   var zChar = makeTextPlane("Z", "blue", size / 10);
  //   zChar.position = new BABYLON.Vector3(0, 0.05 * size, 0.9 * size);
  // };




  start(ngZone: NgZone, inZone = true): void {

    if (inZone) {
      ngZone.runOutsideAngular(() => {
        this.startTheEngine();
      });
    } else {
      this.startTheEngine();
    }
  }

  private startTheEngine() {
    let freshRender = true;
    // const element = this.doc.getElementById('fpsLabel');

    this.engine.runRenderLoop(() => {
      this.scene.render();
      // if (element) {
      //   element.innerHTML = this.engine.getFps().toFixed() + ' fps';
      // }
      if (freshRender) {
        this.engine.resize();
        freshRender = false;
      }
    });
    window.addEventListener('resize', () => this.engine.resize());
  }
}
