import {ElementRef, Injectable} from '@angular/core';
import {BehaviorSubject, fromEvent} from 'rxjs';
import {filter, map, pairwise, tap} from 'rxjs/operators';
import {ResizedDirective} from '../directives/resize-event.directive';

export interface WindowSize {
  height: number;
  width: number;
}

@Injectable({
  providedIn: 'root'
})
export class WindowSizeService {

  windowSize$: BehaviorSubject<WindowSize>;

  windowWidth$: BehaviorSubject<number>;
  windowHeight$: BehaviorSubject<number>;

  constructor() {
    this.windowSize$ = this.getWindowSize$(); // must come above sidebars
    this.windowWidth$ = this.getWindowWidth$();
    this.windowHeight$ = this.getWindowHeight$();

  }

  public getHostSizeChange$(hostElement: ElementRef) {
    const resizedDirective = new ResizedDirective(hostElement);
  }


  private getWindowWidth$(): BehaviorSubject<any> {
    this.windowWidth$ = new BehaviorSubject(window.innerWidth);

    this.windowSize$.pipe(
      pairwise(),
      // tap(val => console.log(val)),
      filter(windowSizes => windowSizes[0].width !== windowSizes[1].width),
      map(windowSizes => windowSizes[1].width)
    ).subscribe(this.windowWidth$);

    return this.windowWidth$;
  }

  private getWindowHeight$(): BehaviorSubject<any> {
    this.windowHeight$ = new BehaviorSubject(window.innerHeight);

    this.windowSize$.pipe(
      pairwise(),
      // tap(val => console.log(val)),
      filter(windowSizes => windowSizes[0].height !== windowSizes[1].height),
      map(windowSizes => windowSizes[1].height)
    ).subscribe(this.windowHeight$);

    return this.windowHeight$;
  }

  private getWindowSize$(): BehaviorSubject<WindowSize> {

    this.windowSize$ = new BehaviorSubject<WindowSize>({
        width: window.innerWidth,
        height: window.innerHeight
      } as WindowSize
    );

    fromEvent(window, 'resize')
      .pipe(
        // debounceTime(100),
        map(event => {
          const window = event.target as Window;
          return {width: window.innerWidth, height: window.innerHeight} as WindowSize;
        }),
        // tap(window => console.log(window))
      )

      .subscribe(this.windowSize$);

    return this.windowSize$;
  }
}
