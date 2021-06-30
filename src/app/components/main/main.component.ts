import {DOCUMENT} from '@angular/common';
import {AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, ViewChild} from '@angular/core';
import {BehaviorSubject, fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {filter, map, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {PickingInfo} from '@babylonjs/core/Collisions/pickingInfo';
import {filterNil} from '../../rxjs_ops/FilterNil';
import {environment} from '../../../environments/environment';
import {BabylonSceneService} from '../../services/babylon-scene.service';
import {CameraPosition, CameraService} from '../../services/camera.service';

/* BABYLON IMPORTS */
import {AbstractMesh, Mesh} from '@babylonjs/core/Meshes';
import {Color3} from '@babylonjs/core/Maths';
import {Scene} from '@babylonjs/core/scene';
import {Animation as BabylonAnimation} from '@babylonjs/core/Animations';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],

})
export class MainComponent implements AfterViewInit, OnDestroy {

  @ViewChild('rCanvas', {static: true})
  canvasRef: ElementRef<HTMLCanvasElement>;

  tvClicked$: Observable<Mesh>;

  // cameraPanToProjectsPosAnim: BabylonAnimation;
  // cameraPanToMainPosAnim: BabylonAnimation;

  spaceBarPressedEvent$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.code === 'Space')
  );

  pKeyPressedEvent$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.code === 'KeyP')
  );


  //
  // deviceOrientation$: Observable<{alpha: number, beta: number, gamma: number}> = fromEvent<DeviceOrientationEvent>(window, 'deviceorientation').pipe(
  //   map(or => {
  //     return {
  //       alpha: or.alpha ? or.alpha : 0,
  //       beta: or.beta ? or.beta : 0,
  //       gamma: or.gamma ? or.gamma : 0
  //     }
  //   }),
  // );

  // deviceAcceleration$: Observable<{x: number, y: number, z: number}> = fromEvent<DeviceMotionEvent>(window, 'devicemotion').pipe(
  //   map((motion: DeviceMotionEvent) => motion.acceleration),
  //   filterNil(),
  //   map(acc => {
  //     return {
  //       x: acc.x ? acc.x : 0,
  //       y: acc.y ? acc.y : 0,
  //       z: acc.z ? acc.z : 0
  //     }
  //   }),
  // );



  isShowBackdrop$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isShowEmail$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  hintText$: ReplaySubject<string | null> = new ReplaySubject<string | null>(1);


  clickEvent$: Observable<any>;

  isShowFps$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  destroy$: Subject<any> = new Subject();

  constructor(@Inject(DOCUMENT) readonly doc: Document,
              private readonly ngZone: NgZone,
              public babylonSceneService: BabylonSceneService,
              public camService: CameraService,
              ) {



    // this.deviceOrientation$.pipe(
    //   // debounceTime(200),
    //   tap(val => console.log('A: ', val.alpha, ', b: ', val.beta, 'g: ', val.gamma))
    // ).subscribe();

    // this.deviceAcceleration$.pipe(
    // ).subscribe(val => console.log(val));

    // Filter click events on whether the backdrop is shown
    this.clickEvent$ = fromEvent<MouseEvent>(document.body, 'click').pipe(
      withLatestFrom(this.isShowBackdrop$),
      filter(([pointerEvent, isShowBackdrop]) => !isShowBackdrop),
      map(([pointerEvent, isShowBackdrop]) => pointerEvent),
      tap(val => console.log(val)),
    );

    this.isShowBackdrop$.pipe(
      takeUntil(this.destroy$),
      filter(isShow => isShow),
    ).subscribe(() => this.hintText$.next(null));

    // this.deviceAcceleration$.pipe(
    //   takeUntil(this.destroy$),
    //   scan((acc, curr) => {
    //     return {
    //       x: acc.x + curr.x,
    //       y: acc.y + curr.y,
    //       z: acc.z + curr.z
    //     }
    //   }),
    //   tap(val => console.log(val)),
    // ).subscribe(pos => this.deviceMotionPosition$.next(pos));

    // this.deviceMotionPosition$.subscribe(val => {
    //   this.hintText$.next('x: ' + val.x + ', y:' + val.y)
    // });

    // this.deviceOrientation$.subscribe(or => {
    //   this.hintText$.next('a: ' + or.alpha.toFixed(2) + ', b:' + or.beta.toFixed(2) + ', g:' + or.gamma.toFixed(2))
    // });

  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngAfterViewInit(): void {
    this.babylonSceneService.createScene$(this.canvasRef).pipe(
      take(1)
    ).subscribe((scene: Scene) => {
      this.camService.camera = this.babylonSceneService.camera;
      this.camService.cameraBasePos$.next(this.babylonSceneService.cameraMainPos); // start pos

      this.camService.cameraPositions.push(
        {
          name: 'main',
          pos: this.babylonSceneService.cameraMainPos
        },
        {
          name: 'projects',
          pos: this.babylonSceneService.cameraProjectsPos
        }
      );

      this.createAndListenForSceneActions(scene);
      this.createFanAnimations(scene);
      this.create24HrsOpenAnimation(scene);
      // this.createCameraMainToProjectAnimation(scene);
      this.babylonSceneService.start(this.ngZone, true);

      // show backdrop if not on main camera pos
      this.camService.currentCameraPos$.pipe(
        takeUntil(this.destroy$),
        tap((pos: CameraPosition) => {
          if (pos.name == 'main') {
            this.isShowBackdrop$.next(false);
          } else {
            this.isShowBackdrop$.next(true);
          }
        })
      ).subscribe();

    })
  }



  isTouchScreenDevice(): boolean {
    return 'ontouchstart' in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0);
  };

  getEmailAddress(): string {
    return 'lofgren' + 'daniel' + '@' + 'hotmail.' + 'com'; // some obfuscation
  }

  closeEmailOverlay() {
    this.isShowBackdrop$.next(false);
    this.isShowEmail$.next(false);
  }

  // createCameraMainToProjectAnimation(scene: Scene) {
  //   const frameRate = 30;
  //   this.cameraPanToProjectsPosAnim = new BabylonAnimation(
  //     "cameraPanToProjects",
  //     "position.y",
  //     frameRate,
  //     BabylonAnimation.ANIMATIONTYPE_VECTOR3);
  //
  //   const keyFrames = [
  //     {
  //       frame: 0,
  //       value: this.babylonSceneService.cameraMainPos
  //     },
  //     {
  //       frame: 45,
  //       value: this.babylonSceneService.cameraProjectsPos
  //     },
  //   ];
  //
  //   this.cameraPanToProjectsPosAnim.setKeys(keyFrames);
  //
  //   this.babylonSceneService.camera.animations.push(this.cameraPanToProjectsPosAnim);
  // }

  createFanAnimations(scene: Scene) {

    /* FANS */
    const ceilingFan0: Mesh = scene.getNodeByName('CeilingFan') as Mesh;
    const ceilingFan1: Mesh = scene.getNodeByName('CeilingFan1') as Mesh;

    const ceilingFan0Holder: Mesh = ceilingFan0.getChildren((node) => node.name === 'FanHolder')[0] as Mesh
    const ceilingFan1Holder: Mesh = ceilingFan1.getChildren((node) => node.name === 'FanHolder')[0] as Mesh

    ceilingFan0Holder.rotationQuaternion = null;
    ceilingFan1Holder.rotationQuaternion = null;

    const fanFrameRate = 10;
    const fan0Rotate = new BabylonAnimation(
      "fan0Rotate",
      "rotation.y",
      fanFrameRate,
      BabylonAnimation.ANIMATIONTYPE_FLOAT,
      BabylonAnimation.ANIMATIONLOOPMODE_CYCLE
    );

    const fan1Rotate = new BabylonAnimation(
      "fan1Rotate",
      "rotation.y",
      fanFrameRate,
      BabylonAnimation.ANIMATIONTYPE_FLOAT,
      BabylonAnimation.ANIMATIONLOOPMODE_CYCLE
    );

    const keyFramesFan0 = [
      {
        frame: 0,
        value: 0
      },
      {
        frame: 20,
        value: 60 * (Math.PI / 180)
      },
    ];

    const keyFramesFan1 = [
      {
        frame: 0,
        value: 0
      },
      {
        frame: 13,
        value: 60 * (Math.PI / 180)
      },
    ];

    fan0Rotate.setKeys(keyFramesFan0);
    fan1Rotate.setKeys(keyFramesFan1);

    ceilingFan0Holder.animations.push(fan0Rotate);
    ceilingFan1Holder.animations.push(fan1Rotate);

    scene.beginAnimation(ceilingFan0Holder, 0, 20, true);
    scene.beginAnimation(ceilingFan1Holder, 0, 13, true);
  }

  /**
   * Blink the 'hrs' in a seemingly random way
   * @param scene
   */
  create24HrsOpenAnimation(scene: Scene) {

    /* FANS */
    const textHrs: Mesh = scene.getNodeByName('text_hrs') as Mesh;

    const baseColor = new Color3(0, 1, 0.1);

    const frameRate = 20;
    const textHrsFlickerAnim = new BabylonAnimation(
      "textHrs_flicker",
      "material.emissiveColor",
      frameRate,
      BabylonAnimation.ANIMATIONTYPE_COLOR3,
      BabylonAnimation.ANIMATIONLOOPMODE_CYCLE,
    )

    const keyFrames = [
      {
        frame: 0,
        value: baseColor
      },
      {
        frame: 20,
        value: baseColor
      },
      {
        frame: 21,
        value: new Color3(0, 0, 0.0)
      },
      {
        frame: 22,
        value: baseColor
      },
      {
        frame: 25,
        value: baseColor
      },
      {
        frame: 26,
        value: new Color3(0, 0, 0.0)
      },
      {
        frame: 30,
        value: new Color3(0, 0, 0.0)
      },
      {
        frame: 31,
        value: baseColor
      },
      {
        frame: 32,
        value: new Color3(0, 0, 0.0)
      },
      {
        frame: 40,
        value: new Color3(0, 0, 0.0)
      },
      {
        frame: 41,
        value: baseColor
      },
      {
        frame: 200,
        value: baseColor
      },
    ];

    textHrsFlickerAnim.enableBlending = false;
    textHrsFlickerAnim.blendingSpeed = 1;

    textHrsFlickerAnim.setKeys(keyFrames);

    textHrs.animations.push(textHrsFlickerAnim);

    scene.beginAnimation(textHrs, 0, 200, true);
  }

  /**
   * Creates listeners for mouse/device movement and clicks.
   * @param scene
   */
  createAndListenForSceneActions(scene: Scene) {


    // this.relativeMousePos$.subscribe(val => console.log(val));

    this.spaceBarPressedEvent$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => this.toggleAllLights());

    this.pKeyPressedEvent$.pipe(
      takeUntil(this.destroy$),
    ).subscribe(() => this.isShowFps$.next(!this.isShowFps$.value));

    /* TVS */

    /* can only use actionManager for hover since the glass blocks picks */
    this.babylonSceneService.registerHover(this.babylonSceneService.topTVCollision, false, () =>
      this.hintText$.next('Press to open my Github'));

    this.babylonSceneService.registerHover(this.babylonSceneService.middleTVCollision, false, () =>
      this.hintText$.next('Press to see my email address'));

    this.babylonSceneService.registerHover(this.babylonSceneService.bottomTVCollision, false, () =>
      this.hintText$.next('Press to go my projects'));

    this.babylonSceneService.registerEndHover(
      this.babylonSceneService.topTVCollision, false, () => this.hintText$.next(null));

    this.babylonSceneService.registerEndHover(
      this.babylonSceneService.middleTVCollision, false, () => this.hintText$.next(null));

    this.babylonSceneService.registerEndHover(
      this.babylonSceneService.bottomTVCollision, false, () => this.hintText$.next(null));

    this.tvClicked$ = this.clickEvent$.pipe(
      takeUntil(this.destroy$),
      map(() =>{
        return scene.pick(
          scene.pointerX,
          scene.pointerY,
          (mesh: AbstractMesh) => {
            return this.getTopMeshParent(mesh).name.includes('TV'); // filter on parent meshes with 'TV' in the name
          });
      }),
      filterNil<PickingInfo>(), // filter null pickedInfo
      map((pickingInfo: PickingInfo) => pickingInfo.pickedMesh), // map to pickedMesh
      filterNil<AbstractMesh>(), // filter null pickedMesh
      map((mesh: AbstractMesh) => {
        return this.getTopMeshParent(mesh) as Mesh; // return top parent
      })
    );

    this.handleTVClicks();

    // this.babylonSceneService.camera.attachControl(this.canvasRef, true); // debug
    // console.log(this.isTouchScreenDevice());

    if (!this.isTouchScreenDevice()) {
      this.camService.moveCameraByMousePos();
    } else {

      this.camService.moveCameraByDeviceMotion();
    }

    scene.registerBeforeRender(() => {
      // console.log(this.babylonSceneService.camera.position);
    });
  }



  handleTVClicks(): void {
    this.tvClicked$.subscribe((mesh: Mesh) => {

      switch (mesh.name) {
        case 'TV2': { // top tv
          window.open(environment.githubURL, '_blank');
          break;
        }
        case 'TV1': { // middle tv
          this.isShowEmail$.next(true);
          this.isShowBackdrop$.next(true);
          break;
        }
        case 'TV': { // bottom tv
          console.log('TV');
          // this.cameraBasePos$.next(this.babylonSceneService.cameraProjectsPos);
          this.hintText$.next(null);
          this.camService.moveBaseCameraPositionName('projects');

          // this.babylonSceneService.camera.position.x = this.babylonSceneService.cameraProjectsPos.x;
          // console.log(this.babylonSceneService.camera.animations);
          // this.babylonSceneService.camera.beginAnimation('cameraPanToProjects');
          // this.babylonSceneService.scene.beginDirectAnimation(
          //   this.babylonSceneService.camera,[this.cameraPanToProjectsPosAnim], 0, 45, false);
          break;
        }
      }
    });
  }





  getTopMeshParent(mesh: AbstractMesh): AbstractMesh {

    if (mesh.parent != null) {
      if (mesh.parent!.parent != null) {
        return this.getTopMeshParent(mesh.parent as Mesh);
      } else {
        return mesh.parent as Mesh;
      }
    }

    return mesh; // no parent
  }

  toggleAllLights(): void {
    // const isOn = this.scene.lightsEnabled = !this.scene.lightsEnabled;
    this.babylonSceneService.scene.lights.forEach(light => {
      // console.log(light);
      light.setEnabled(!light.isEnabled());
    })
  }


}
