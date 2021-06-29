import {ElementRef, Injectable, NgZone} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {fromPromise} from 'rxjs/internal-compatibility';
import {DeviceDetectorService} from 'ngx-device-detector';

/* BABYLON IMPORTS */
import {SpotLight} from '@babylonjs/core/Lights';
import {ShadowGenerator} from '@babylonjs/core/Lights/Shadows';
import {AbstractMesh, Mesh} from '@babylonjs/core/Meshes';
import {Color3, Vector3} from '@babylonjs/core/Maths/math';
import {Material, PBRMetallicRoughnessMaterial, StandardMaterial, Texture} from '@babylonjs/core/Materials';
import {RenderTargetTexture, VideoTexture} from '@babylonjs/core/Materials/Textures';
import {Scene} from '@babylonjs/core/scene';
import {Engine} from '@babylonjs/core/Engines';
import {ReflectionProbe} from '@babylonjs/core/Probes';
import {SceneLoader} from '@babylonjs/core/Loading';
import {ActionEvent, ActionManager, ExecuteCodeAction} from '@babylonjs/core/Actions';
import {VideoTextureSettings} from '@babylonjs/core/Materials/Textures/videoTexture';

import {GlowLayer} from '@babylonjs/core/Layers';
import '@babylonjs/core/Rendering/boundingBoxRenderer'; // seems to be a bug with babylonJs that requires boundingBoxRenderer to be imported like this for GlowLayer to work
import {UniversalCamera} from '@babylonjs/core/Cameras';
import '@babylonjs/core/Cameras/universalCamera'; // seems to be a bug with babylonJs that requires UniversalCamera to be imported like this

@Injectable({
  providedIn: 'root'
})
export class BabylonSceneService {

  engine: Engine;
  canvas: HTMLCanvasElement;
  camera: UniversalCamera;
  cameraMainPos: Vector3;
  cameraProjectsPos: Vector3;

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


  constructor(private deviceService: DeviceDetectorService) {
    console.log(this.deviceService.deviceType);
  }

  appendFromBabylonFile$(): Observable<any> {
    return fromPromise(
      SceneLoader.AppendAsync('assets/full_scene/', 'main.babylon', this.scene)
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
      // tap(nodes => console.log(nodes)),
      tap(scene => this.handleLoadedStaticBabylonFile(scene))
    );
  }

  handleLoadedStaticBabylonFile(scene: Scene): void {
    /* CAMERA */
    // this.camera = scene.cameras[0] as UniversalCamera;

    this.camera = scene.getNodeByName('cameraMain') as UniversalCamera;
    this.cameraMainPos = this.camera.position.clone(); // clone

    // we only care about its position since we animate the main camera to that position
    this.cameraProjectsPos = ( scene.getNodeByName('cameraProjects') as UniversalCamera ).position.clone(); // clone

    /* MATERIAL MAX LIGHTS LIMIT INCREASE */
    scene.materials.forEach((mat: Material) => {
      if (mat instanceof PBRMetallicRoughnessMaterial) {
        if ( this.deviceService.isDesktop() ) {
          mat.maxSimultaneousLights = 6 // webGL device dependant error if set above 10
        } else {
          mat.maxSimultaneousLights = 3 // webGL device dependant error if set above 10
        }
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

    glassMat.baseColor = Color3.Black();
    glassMat.metallic = 0;

    glassMat.alpha = 0.5;

    /* GLASS REFLECTION */
    // only on desktop
    if ( this.deviceService.isDesktop() ) {

      const reflectionBG: AbstractMesh = scene.getNodeByName('reflectionBG') as AbstractMesh;
      // const trashcan: AbstractMesh = scene.getNodeByName('trashcan_group') as AbstractMesh;
      // const bench: AbstractMesh = scene.getNodeByName('bench') as AbstractMesh;

      if (this.windowReflectionProbe.renderList != null) {
        if (reflectionBG != null) {
          this.windowReflectionProbe.renderList.push(reflectionBG);
        }
        // if (trashcan != null) {
        //   trashcan.getChildMeshes().forEach(mesh => {
        //     if (mesh != null && this.windowReflectionProbe.renderList != null) {
        //       this.windowReflectionProbe.renderList.push(mesh);
        //     }
        //   });
        // }
        // if (bench != null) {
        //   this.windowReflectionProbe.renderList.push(bench);
        // }
      }
      glassMat.environmentTexture = this.windowReflectionProbe.cubeTexture;
    }


    /* SHADOWS */
    /* Create SHADOW GENERATORS */
    scene.lights.forEach((light) => {
      if (light instanceof SpotLight) {
        // console.log(light);

        if ((this.lightNamesWithUpdatingShadows.includes(light.name))) {
          // lower res shadows for dynamic lights

          if ( this.deviceService.isDesktop() ) {
            this.shadowGenerators.push(
              new ShadowGenerator(512, light)
            );
          } else {
            this.shadowGenerators.push(
              new ShadowGenerator(128, light)
            );
          }
        } else {
          this.shadowGenerators.push(
            new ShadowGenerator(1024, light)
          );
        }

      }
    });
    /* ADD MESHES TO GENERATORS */
    this.scene.meshes.forEach(mesh => {

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
      if (!(this.lightNamesWithUpdatingShadows.includes(gen.getLight().name))) {
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

    const videoSettings: VideoTextureSettings = {
      autoPlay: true,
      loop: true,
      autoUpdateTexture: true,
      muted: true,
    }

    /* GITHUB */

    const githubVideoSources: string[] = [
      "assets/video/github/github.webm",
      "assets/video/github/github.mp4",
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
    // only add glow on desktop due to performance
    if ( this.deviceService.isDesktop() ) {
      var gl = new GlowLayer("glow", this.scene, {
        mainTextureFixedSize: 1024,
        blurKernelSize: 256
      });
      gl.intensity = 1.5;

      gl.addExcludedMesh(topTVScreen);
      gl.addExcludedMesh(middleTVScreen);
      gl.addExcludedMesh(bottomTVScreen);
    }
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
