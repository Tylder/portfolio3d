import {Injectable, OnDestroy} from '@angular/core';
import {UniversalCamera} from '@babylonjs/core/Cameras';
import {BehaviorSubject, combineLatest, fromEvent, Observable, of, ReplaySubject, Subject} from 'rxjs';
import {Vector3} from '@babylonjs/core/Maths/math';
import {Scalar, Vector2} from '@babylonjs/core/Maths';
import {finalize, map, startWith, switchMap, take, takeUntil, takeWhile, tap} from 'rxjs/operators';
import easeOperator from 'rx-ease';
import {WindowSizeService} from './window-size.service';

export interface CameraPosition {
  name: string;
  pos: Vector3;
}

export interface CameraLimits {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

@Injectable({
  providedIn: 'root'
})
export class CameraService implements OnDestroy {


  // the camera position in which we move around when when the mouse is moved, used so that we can animate it
  cameraBasePos$: ReplaySubject<Vector3> = new ReplaySubject<Vector3>(1);
  relativeMousePos$: ReplaySubject<Vector2> = new ReplaySubject<Vector2>(1);
  relativeDeviceMotion$: ReplaySubject<Vector2> = new ReplaySubject<Vector2>(1);
  currentCameraPos$: ReplaySubject<CameraPosition> = new ReplaySubject<CameraPosition>(1);

  cameraPositions: CameraPosition[] = [];

  camera: UniversalCamera;

  cameraLimits: CameraLimits = {
    minX: - 1.5,
    maxX: 1.5,
    minY: 1,
    maxY: - 1,
  };

  deviceMotionPosition$: BehaviorSubject<Vector3> = new BehaviorSubject(new Vector3());
  mouseMoveEvent$: Observable<any> = fromEvent<MouseEvent>(document.body, 'mousemove');

  destroy$: Subject<any> = new Subject();

  constructor(private windowSizeService: WindowSizeService) {
    this.createRelativeMousePos();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
  }

  moveBaseCameraPositionName(newPosName: string): void {

    /* https://www.npmjs.com/package/rx-ease */

    const newPos: CameraPosition | undefined = this.cameraPositions.find(pos => pos.name === newPosName);

    if (newPos == null) {
      return;
    }

    this.cameraBasePos$.pipe(
      take(1),
      switchMap((startPos: Vector3) => {
        return of(null).pipe(
          take(1),
          map(() => newPos.pos),
          startWith(startPos),
          map((pos: Vector3) => {
            return {
              x: pos.x,
              y: pos.y
            }
          }),
          easeOperator({
            x: [120, 18],
            y: [120, 18]
          }),
          map(({x, y}) => {
            return new Vector3(x, y, startPos.z)
          }),
        )
      }),
      tap(pos => this.cameraBasePos$.next(pos)),
      finalize(() => this.currentCameraPos$.next(newPos)),
      takeWhile(pos => pos.x != newPos.pos.x), // only way I could see to end the observable
    ).subscribe();
  }

  /**
   * Move camera in x and y by cameraBasePos and relativeMousePos$
   */
  moveCameraByMousePos(): void {

    combineLatest([this.cameraBasePos$, this.relativeMousePos$]).pipe(
      // tap(([basePos, relativePos]) => console.log(basePos + ' ' + relativePos )),
      tap(([basePos, relativePos]) => {
        if (relativePos) {
          const newCamX = Scalar.Lerp(basePos.x + this.cameraLimits.minX, basePos.x + this.cameraLimits.maxX, relativePos.x);
          const newCamY = Scalar.Lerp(basePos.y + this.cameraLimits.minY, basePos.y + this.cameraLimits.maxY, relativePos.y);
          this.camera.position.x = newCamX;
          this.camera.position.y = newCamY;
        }
      })
    ).subscribe()
  }

  moveCameraByDeviceMotion(): void {

    combineLatest([this.cameraBasePos$]).pipe(
      // tap(([basePos, relativePos]) => console.log(basePos + ' ' + relativePos )),
      tap(([basePos]) => {
        // const newCamX = Scalar.Lerp(basePos.x + this.cameraLimits.minX, basePos.x + this.cameraLimits.maxX, relativePos.x);
        // const newCamY = Scalar.Lerp(basePos.y + this.cameraLimits.minY, basePos.y + this.cameraLimits.maxY, relativePos.y);
        this.camera.position.x = basePos.x;
        this.camera.position.y = basePos.y;

      })
    ).subscribe()



    // this.deviceAcceleration$.pipe(
    //   tap((acc) => {
    //     // const newCamX = Scalar.Lerp(this.cameraLimits.minX, this.cameraLimits.maxX, relativePos.x);
    //     // const newCamY = Scalar.Lerp(this.cameraLimits.minY, this.cameraLimits.maxY, relativePos.y);
    //     // this.babylonSceneService.camera.position.x = newCamX;
    //     // this.babylonSceneService.camera.position.y = newCamY;
    //   })
    // ).subscribe()
  }

  /**
   * Create relative mouse pos to screen size.
   * x: 0, y: 0 is top left corner.
   * x: 1, y: 1 is bottom right corner.
   */
  createRelativeMousePos(): void {
    combineLatest(
      [
        this.windowSizeService.windowSize$,
        this.mouseMoveEvent$.pipe(
          takeUntil(this.destroy$),
          map((event: MouseEvent) => new Vector2(event.clientX, event.clientY)),
        )
      ]
    ).pipe(
      // tap(val => console.log(val)),
      map(([size, mousePos]) => {
        // make relative to window size
        mousePos.x = mousePos.x / size.width;
        mousePos.y = mousePos.y / size.height;

        return mousePos;
      })
    ).subscribe(relativePos => this.relativeMousePos$.next(relativePos));
  }

  createRelativeDeviceMotion(): void {
    combineLatest(
      [
        this.windowSizeService.windowSize$,
        this.deviceMotionPosition$
      ]
    ).pipe(
      takeUntil(this.destroy$),
      // tap(val => console.log(val)),
      map(([size, pos]) => {
        return new Vector2(pos.x / size.width, pos.y / size.height);
      })
    ).subscribe(relativePos => this.relativeMousePos$.next(relativePos));
  }
}
