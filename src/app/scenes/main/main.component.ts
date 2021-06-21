import {AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, ViewChild} from '@angular/core';

import {BehaviorSubject, combineLatest, fromEvent, Observable, ReplaySubject, Subject} from 'rxjs';
import {filter, map, take, takeUntil, tap, withLatestFrom} from 'rxjs/operators';
import {WindowSizeService} from '../../services/window-size.service';

import {PickingInfo} from '@babylonjs/core/Collisions/pickingInfo';
import {filterNil} from '../../rxjs_ops/FilterNil';
import {environment} from '../../../environments/environment';
import {BabylonSceneService} from '../../services/babylon-scene.service';
import {AbstractMesh, Mesh} from '@babylonjs/core/Meshes';
import {Scalar} from '@babylonjs/core/Maths';
import {Scene} from '@babylonjs/core/scene';
import {DOCUMENT} from '@angular/common';
import {Animation as BabylonAnimation} from '@babylonjs/core/Animations';

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
export class MainComponent implements AfterViewInit, OnDestroy {

  @ViewChild('rCanvas', {static: true})
  canvasRef: ElementRef<HTMLCanvasElement>;

  tvClicked$: Observable<Mesh>;

  spaceBarPressedEvent$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.code === 'Space')
  );

  relativeMousePos$: BehaviorSubject<{x: number, y: number} | undefined> =
    new BehaviorSubject<{x: number, y: number} | undefined>(undefined);

  test$: Observable<any> = fromEvent<any>(window, 'deviceorientation');

  cameraLimits: CameraLimits;

  isShowBackdrop$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  isShowEmail$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  hintText$: ReplaySubject<string | null> = new ReplaySubject<string | null>(1);

  mouseMoveEvent$: Observable<any> = fromEvent<MouseEvent>(document.body, 'mousemove');
  clickEvent$: Observable<any>;

  destroy$: Subject<any> = new Subject();

  constructor(@Inject(DOCUMENT) readonly doc: Document,
              private readonly ngZone: NgZone,
              private babylonSceneService: BabylonSceneService,
              private windowSizeService: WindowSizeService,
              ) {

    this.test$.subscribe(val => console.log(val));

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



  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngAfterViewInit(): void {
    this.babylonSceneService.createScene$(this.canvasRef).pipe(
      take(1)
    ).subscribe((scene: Scene) => {
      this.createAndListenForSceneActions(scene);
      this.createAnimations(scene);
      this.babylonSceneService.start(this.ngZone, true);
    })
  }

  isTouchScreenDevice(): boolean {
    return 'ontouchstart' in window || (navigator.maxTouchPoints != null && navigator.maxTouchPoints > 0);
  };

  getEmailAddress(): string {
    return 'lofgren' + 'daniel' + '@' + 'hotmail.' + 'com'; // some obfuscation
  }

  closeEmailOverlay() {
    console.log('test123123123');
    console.log(this.isShowEmail$.value);


    this.isShowBackdrop$.next(false);
    this.isShowEmail$.next(false);
  }

  createAnimations(scene: Scene) {

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
    )

    const fan1Rotate = new BabylonAnimation(
      "fan1Rotate",
      "rotation.y",
      fanFrameRate,
      BabylonAnimation.ANIMATIONTYPE_FLOAT,
      BabylonAnimation.ANIMATIONLOOPMODE_CYCLE
    )

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

  createAndListenForSceneActions(scene: Scene) {

    /* CAMERA  LIMITS */
    this.cameraLimits = {
      minX: this.babylonSceneService.camera.position.x - 1,
      maxX: this.babylonSceneService.camera.position.x + 1,
      minY: this.babylonSceneService.camera.position.y + 1,
      maxY: this.babylonSceneService.camera.position.y - 1,
    };

    this.createRelativeMousePos();

    // this.relativeMousePos$.subscribe(val => console.log(val));

    this.spaceBarPressedEvent$.subscribe(() => this.toggleAllLights());

    /* TVS*/

    /* can only use actionManager for hover since the glass blocks picks */
    this.babylonSceneService.registerHover(this.babylonSceneService.topTVCollision, false, () =>
      this.hintText$.next('Press to open my Github'));

    this.babylonSceneService.registerHover(this.babylonSceneService.middleTVCollision, false, () =>
      this.hintText$.next('Press to see my email address'));

    this.babylonSceneService.registerEndHover(this.babylonSceneService.topTVCollision, false, () => this.hintText$.next(null));
    this.babylonSceneService.registerEndHover(this.babylonSceneService.middleTVCollision, false, () => this.hintText$.next(null));

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

    // this.tvClicked$.subscribe(val => console.log(val));

    this.handleTVClicks();

    // this.babylonSceneService.camera.attachControl(this.canvasRef, true);

    console.log(this.isTouchScreenDevice());

    scene.registerBeforeRender(() => {

      if (!this.isTouchScreenDevice()) {
        this.moveCameraByMousePos();
      } else {
        this.moveCameraByGyro();
      }
    });
  }

  moveCameraByMousePos(): void {
    this.relativeMousePos$.pipe(
      take(1),
      tap((relativePos) => {
        if (relativePos) {
          const newCamX = Scalar.Lerp(this.cameraLimits.minX, this.cameraLimits.maxX, relativePos.x);
          const newCamY = Scalar.Lerp(this.cameraLimits.minY, this.cameraLimits.maxY, relativePos.y);
          this.babylonSceneService.camera.position.x = newCamX;
          this.babylonSceneService.camera.position.y = newCamY;
        }
      })
    ).subscribe()
  }

  moveCameraByGyro(): void {
    this.relativeMousePos$.pipe(
      take(1),
      tap((relativePos) => {
        if (relativePos) {
          const newCamX = Scalar.Lerp(this.cameraLimits.minX, this.cameraLimits.maxX, relativePos.x);
          const newCamY = Scalar.Lerp(this.cameraLimits.minY, this.cameraLimits.maxY, relativePos.y);
          this.babylonSceneService.camera.position.x = newCamX;
          this.babylonSceneService.camera.position.y = newCamY;
        }
      })
    ).subscribe()
  }

  handleTVClicks(): void {
    this.tvClicked$.subscribe((mesh: Mesh) => {
      if (mesh.name === 'TV2') { // top tv
        window.open(environment.githubURL, '_blank');
      } else if (mesh.name === 'TV1') { // middle tv
        // this.openEmailModal();
        this.isShowEmail$.next(true);
        this.isShowBackdrop$.next(true);
      }
    });
  }

  openEmailModal() {
    // const configs = new OverlayConfig({
    //   hasBackdrop: true,
    //   height: '100vh',
    //   width: '100vw',
    // });
    //
    // /// Center the modal
    // configs.positionStrategy = this.overlayService.overlay.position()
    //   .global()
    //   .centerHorizontally()
    //   .centerVertically();
    //
    // this.overlayService.openComponent<any, any>(
    //   EmailModalComponent,
    //   configs,
    //   {}
    // );
  }

  createRelativeMousePos(): void {
    combineLatest(
      [
        this.windowSizeService.windowSize$,
        this.mouseMoveEvent$.pipe(
          takeUntil(this.destroy$),
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
  //
  // onTVHover(event: ActionEvent): void {
  //   console.log('hovered');
  //   console.log(event);
  //
  //   const meshName = getTopMeshParent(event.meshUnderPointer as Mesh)?.name;
  //
  //   if (meshName === 'TV2') {
  //     console.log('tv2');
  //     // this.hintText$.next('Press to open github in second tab');
  //   }
  //
  //   function getTopMeshParent(mesh: AbstractMesh): AbstractMesh {
  //
  //     if (mesh.parent != null) {
  //       if (mesh.parent!.parent != null) {
  //         return getTopMeshParent(mesh.parent as Mesh);
  //       } else {
  //         return mesh.parent as Mesh;
  //       }
  //     }
  //
  //     return mesh; // no parent
  //   }
  //
  //   // console.log(this.getTopMeshParent(event.meshUnderPointer as Mesh));
  //
  //
  // }


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
      console.log(light);
      light.setEnabled(!light.isEnabled());
    })
  }


}
