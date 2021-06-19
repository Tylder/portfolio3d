import {AfterViewInit, Component, ElementRef, Inject, NgZone, OnDestroy, ViewChild} from '@angular/core';

import {BehaviorSubject, combineLatest, fromEvent, Observable, Subject} from 'rxjs';
import {filter, map, take, takeUntil, tap} from 'rxjs/operators';
import {WindowSizeService} from '../../services/window-size.service';

import {PickingInfo} from '@babylonjs/core/Collisions/pickingInfo';
import {filterNil} from '../../rxjs_ops/FilterNil';
import {environment} from '../../../environments/environment';
import {BabylonSceneService} from '../../services/babylon-scene.service';
import {AbstractMesh, Mesh} from '@babylonjs/core/Meshes';
import {Scalar} from '@babylonjs/core/Maths';
import {Scene} from '@babylonjs/core/scene';
import {DOCUMENT} from '@angular/common';

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

  mouseMoveEvent$: Observable<any> = fromEvent<MouseEvent>(document.body, 'mousemove');
  clickEvent$: Observable<any> = fromEvent<MouseEvent>(document.body, 'click');

  tvClicked$: Observable<Mesh>;

  spaceBarPressedEvent$: Observable<KeyboardEvent> = fromEvent<KeyboardEvent>(document.body, 'keydown').pipe(
    filter((event: KeyboardEvent) => event.code === 'Space')
  );

  relativeMousePos$: BehaviorSubject<{x: number, y: number} | undefined> =
    new BehaviorSubject<{x: number, y: number} | undefined>(undefined);

  cameraLimits: CameraLimits;

  destroy$: Subject<any> = new Subject();

  constructor(@Inject(DOCUMENT) readonly doc: Document,
              private readonly ngZone: NgZone,
              private babylonSceneService: BabylonSceneService,
              private windowSizeService: WindowSizeService,
              ) {

    // this.windowSizeService.windowSize$.subscribe(val => console.log(val));



    // this.babylonSceneService.onSceneLoadedAndSetup$.pipe(
    //   take(1),
    // ).subscribe(this.createAndListenForSceneActions);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  ngAfterViewInit(): void {
    this.babylonSceneService.createScene$(this.canvasRef).pipe(
      take(1)
    ).subscribe((scene: Scene) => {
      this.createAndListenForSceneActions(scene);
      this.babylonSceneService.start(this.ngZone, true);
    })
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

    scene.registerBeforeRender(() => {

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

    });
  }

  handleTVClicks(): void {
    this.tvClicked$.subscribe((mesh: Mesh) => {
      if (mesh.name === 'TV2') { // top tv
        console.log('here');
        window.open(environment.githubURL, '_blank');
      } else if (mesh.name === 'TV1') { // middle tv

      }
    });
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

  // onTVHover(event: ActionEvent): void {
  //   // console.log('hovered');
  //   // console.log(event);
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
