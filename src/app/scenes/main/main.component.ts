import {Component, ElementRef, Inject, NgZone, OnInit, ViewChild} from '@angular/core';
import {
  AbstractMesh, ActionEvent, ActionManager,
  Color3, DoNothingAction,
  Engine, ExecuteCodeAction,
  FreeCamera, InterpolateValueAction,
  Light,
  Material,
  Mesh, MirrorTexture, PBRMaterial,
  PBRMetallicRoughnessMaterial, Plane, ReflectionProbe, RenderTargetTexture, Scalar,
  Scene,
  SceneLoader, ShadowGenerator, SpotLight, StandardMaterial, Texture,
  UniversalCamera, Vector3, VideoTexture
} from '@babylonjs/core';
import {CameraController} from '../../classes/cameraController';
import {DOCUMENT} from '@angular/common';
import {BehaviorSubject, combineLatest, forkJoin, fromEvent, Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal-compatibility';
import {filter, map, take, tap} from 'rxjs/operators';
import {WindowSizeService} from '../../services/window-size.service';
import {Matrix} from '@babylonjs/core/Maths/math.vector';
import {FloatArray} from '@babylonjs/core/types';
import {VideoTextureSettings} from '@babylonjs/core/Materials/Textures/videoTexture';

export interface CameraLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {

  @ViewChild('rCanvas', {static: true})
  canvasRef: ElementRef<HTMLCanvasElement>;

  mouseMoveEvent$: Observable<any> = fromEvent(document.body, 'mousemove');

  spaceBarPressedEvent$: Observable<any>;
  // mousePos$: Observable<any>;

  relativeMousePos$: BehaviorSubject<{x: number, y: number} | undefined> =
    new BehaviorSubject<{x: number, y: number} | undefined>(undefined);

  protected engine: Engine;
  protected canvas: HTMLCanvasElement;
  // protected camera: ArcRotateCamera;
  protected camera: UniversalCamera;
  protected cameraCtrl: CameraController;
  // protected light: Light;
  // cameraCenterPos: Vector3;

  cameraLimits: CameraLimits;

  shadowGenerators: ShadowGenerator[] = [];

  windowReflectionProbe: ReflectionProbe;

  lightNamesWithUpdatingShadows: String[] = ['InnerLightCeilingFanShadow'];

  // window: ReflectionProbe;

  env: any;
  scene: Scene;


  constructor(@Inject(DOCUMENT) readonly doc: Document,
              private readonly ngZone: NgZone,
              private windowSizeService: WindowSizeService,
              ) {

    // this.windowSizeService.windowSize$.subscribe(val => console.log(val));

    this.createRelativeMousePos();

    // this.relativeMousePos$.subscribe(val => console.log(val));


    this.spaceBarPressedEvent$ = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
      filter((event: KeyboardEvent) => event.code === 'Space')
    );

    this.spaceBarPressedEvent$.subscribe(() => this.toggleAllLights());

  }

  createRelativeMousePos(): void {
    combineLatest(
      [
        this.windowSizeService.windowSize$,
        this.mouseMoveEvent$.pipe(
          map((event: MouseEvent) => {
            return {
              x: event.clientX,
              y: event.clientY
            }
          }),
        )
      ]
    ).pipe(
      // tap(val => console.log(val)),
      map(([size, pos]) => {
        return {
          x: pos.x / size.width,
          y: pos.y / size.height
        }
      })
    ).subscribe(relativePos => this.relativeMousePos$.next(relativePos));
  }

  ngOnInit(): void {

    this.createScene$(this.canvasRef)
      .subscribe(() => this.start(true));


  }

  appendFromBabylonFile$(): Observable<any> {
    return fromPromise(
      SceneLoader.AppendAsync('assets/full_scene15/', 'main.babylon', this.scene)
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

    this.windowReflectionProbe = new ReflectionProbe('window', 512, this.scene);

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

    this.scene.registerBeforeRender(() => {

      this.relativeMousePos$.pipe(
        take(1),
        tap((relativePos) => {
          if (relativePos) {
            const newCamX = Scalar.Lerp(this.cameraLimits.minX, this.cameraLimits.maxX, relativePos.x);
            const newCamY = Scalar.Lerp(this.cameraLimits.minY, this.cameraLimits.maxY, relativePos.y);
            this.camera.position.x = newCamX;
            this.camera.position.y = newCamY;
          }
        })
      ).subscribe()
      // console.log(this.camera.position);
      // let newCamPos = Object.assign(this.camera.position, {});
      // newCamPos.set(newCamPos.x + 0.001, newCamPos.y, newCamPos.y);
      // console.log(newCamPos);
      //
      // this.camera.position = Vector3.Lerp(this.camera.position, newCamPos,0.05);
    });

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

    /* LIMITS */

    this.cameraLimits = {
      minX: this.camera.position.x - 1,
      maxX: this.camera.position.x + 1,
      minY: this.camera.position.y + 1,
      maxY: this.camera.position.y - 1,
    };

    /* MATERIAL MAX LIGHTS LIMIT INCREASE */
    scene.materials.forEach((mat: Material) => {
      // console.log(typeof mat);
      if (mat instanceof PBRMetallicRoughnessMaterial) {
        // console.log(mat);
        mat.maxSimultaneousLights = 10 // webGL device dependant error if set above 10
      }
    });

    /* FACADE MAT */
    // const facadeMat = scene.getMaterialByName('Facade') as PBRMetallicRoughnessMaterial;
    // console.log(facadeMat);
    // if (facadeMat != null) {
    //   var lightmap = new Texture("assets/full_scene2/Facade_and_road_combinedShape_blk5.jpg", this.scene);
    //   // facadeMat.lightmapTexture = lightmap;
    //   facadeMat.useLightmapAsShadowmap = false;
    //   // facadeMat.disableLighting = true;
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

    // newGlassMat.reflectionTexture = this.windowReflectionProbe.cubeTexture;

    // glassNode.material = newGlassMat;
    // console.log(origGlassMat);
    // if (origGlassMat != null) {
    //   origGlassMat.alpha = 0.2;
    //
    //   glassMat.re
    //   glassMat.alphaMode = 4 // 4 | ALPHA_MULTIPLY
      // var lightmap = new Texture("assets/full_scene2/Facade_and_road_combinedShape_blk5.jpg", this.scene);
      // facadeMat.lightmapTexture = lightmap;
      // facadeMat.useLightmapAsShadowmap = false;
      // facadeMat.disableLighting = true;
    // }
    //
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
            new ShadowGenerator(2048, light)
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
    const topTV: Mesh = scene.getNodeByName('TV2') as Mesh;
    const middleTV: Mesh = scene.getNodeByName('TV1') as Mesh;
    const bottomTV: Mesh = scene.getNodeByName('TV') as Mesh;

    const topTVScreen: Mesh = topTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;
    const middleTVScreen: Mesh = middleTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;
    const bottomTVScreen: Mesh = bottomTV.getChildMeshes(false, (node) => node.name === 'kinescope')[0] as Mesh;

    // const topTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenTopMat') as PBRMetallicRoughnessMaterial;
    // const middleTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenMiddleMat') as PBRMetallicRoughnessMaterial;
    // const bottomTVScreenMat: PBRMetallicRoughnessMaterial = scene.getMaterialByName('tvScreenBottomMat') as PBRMetallicRoughnessMaterial;

    /* can only use actionManager for hover since the glass blocks picks */
    this.registerHover(topTV, this.onTVHover);
    this.registerHover(middleTV, this.onTVHover);
    // this.registerHover(bottomTV, this.onTVHover);

    // const topTVScreen: Mesh = topTV.getChildren((node) => node.name === 'kinescope')[0] as Mesh;



    console.log(topTVScreen);

    const videoSettings: VideoTextureSettings = {
      autoPlay: true,
      loop: true,
      autoUpdateTexture: true,
      muted: true,
      poster: 'assets/full_scene11/empty-akihabara-tokyo-3.jpeg'
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


  }

  /**
   * Change pointer to hand when hovering over mesh and trigger given function
   *
   * @param mesh
   * @param func
   */
  registerHover(mesh: Mesh, func: (evt: ActionEvent) => void) {
    mesh.getChildMeshes(false).forEach(_mesh => {

      _mesh.isPickable = true;
      _mesh.actionManager = new ActionManager(this.scene);
      _mesh.actionManager.registerAction(
        new ExecuteCodeAction(
          ActionManager.OnPointerOverTrigger,
          func
        )
      );

    });
  }

  onTVHover(event: ActionEvent): void {
    console.log('hovered');
    console.log(event);
    console.log(getTopMeshParent(event.meshUnderPointer as Mesh));

    function getTopMeshParent(mesh: Mesh): Mesh {

      if (typeof mesh.parent != null) {
        if (mesh.parent!.parent != null) {
          return getTopMeshParent(mesh.parent as Mesh);
        } else {
          return mesh.parent as Mesh;
        }
      }

      return mesh; // no parent
    };
  }

  onTVClicked(event: ActionEvent): void {
    console.log('clicked');
  }



  toggleAllLights(): void {
    // const isOn = this.scene.lightsEnabled = !this.scene.lightsEnabled;
    this.scene.lights.forEach(light => {
      console.log(light);
      light.setEnabled(!light.isEnabled());
    })
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
}
