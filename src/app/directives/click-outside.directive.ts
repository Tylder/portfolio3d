import {AfterViewInit, Directive, ElementRef, EventEmitter, Input, Output} from '@angular/core';
import {fromEvent, Observable} from 'rxjs';
import {filter, map, tap} from 'rxjs/operators';

/**
 * Returns an event of the same name if a click is found outside hostElement.
 * Works even if there have been changes to any elements on the click.
 * For example if the element you clicked is deleted on the same click.
 * As long as the element you place this directive on isn't changed and is a ancestor of the clicked element.
 *
 * The example you find most common online look like this
 * const el = this.hostElement.nativeElement as HTMLElement;
 * const clickedInside = el.contains(target);
 * return !clickedInside;
 *
 * but this doesn't work if the element you click changes or is removed.
 * So instead we are using the path and checking each ancestor of the clicked element until we find, or not,
 * the hostElement.
 *
 * Optional inputs of include lists.
 * Used when an overlay is created and you press something inside that overlay.
 * Since the overlay is created outside of the normal DOM it would be registered as outside unless you include it.
 * For example. using angular Material a select-option list is created in an overlay and any presses on an option would
 * be registered as outside. You should then add mat-option to ignore in order to add any presses inside of it and consider them
 * 'inside'.
 *
 *
 *   @Output() appClickOutside = new EventEmitter<void>();
 *   @Input() clickOutsideIncludeNodeList: string[] = []; // not case sensitive
 *   @Input() clickOutsideIncludeIdList: string[] = []; // not case sensitive
 *   @Input() clickOutsideIncludeClassList: string[] = []; // not case sensitive
 *   @Input() clickOutsideIgnoreFirstNoOfClicks: number = 0; // clicks to ignore, useful when the you wish to ignore the first
 *   click
 */

@Directive({
  selector: '[appClickOutside]'
})



export class ClickOutsideDirective implements AfterViewInit {

  @Output() appClickOutside = new EventEmitter<void>();
  @Input() clickOutsideIncludeNodeList: string[] = []; // not case sensitive
  @Input() clickOutsideIncludeIdList: string[] = []; // not case sensitive
  @Input() clickOutsideIncludeClassList: string[] = []; // not case sensitive
  @Input() clickOutsideIgnoreFirstNoOfClicks: number = 0; // clicks to ignore

  click$: Observable<any>;

  noOfClicks: number = 0;

  constructor(private hostElement: ElementRef) {}

  ngAfterViewInit(): void {
    this.click$ = fromEvent(document, 'click');

    this.click$.pipe(
      tap(() => this.noOfClicks++),
      filter(() => this.noOfClicks >= this.clickOutsideIgnoreFirstNoOfClicks + 1),
      // tap(() => console.log(this.hostElement.nativeElement as HTMLElement)),
      // tap((event: MouseEvent) => console.log(event)),
      map((event: MouseEvent) => event.composedPath() as HTMLElement[]),
      /* Uncomment this console.log to see the path and figure out what to ignore to make it work */
      // tap(path => console.log(path)),

      filter((path: HTMLElement[]) => {
        const el = this.hostElement.nativeElement as HTMLElement;

        /* Check if the hostElement exist in the path of the target element,
        * If it does then we know that the click target is inside the hostElement
        * even if any element has changed or been removed since */
        for (const element of path) {
          if (element === el) { return false; }

          /* NODE NAME*/
          if (this.clickOutsideIncludeNodeList.length > 0) {
            const nodeName = element.nodeName;

            if (nodeName !== undefined &&
              this.clickOutsideIncludeNodeList.findIndex(name => name.toLowerCase() === nodeName.toLowerCase()) !== -1) {
              // console.log('Node Name found');
              return false;
            }
          }

          /* ID */
          if (this.clickOutsideIncludeIdList.length > 0) {
            const idName = element.id;

            if (idName !== undefined &&
              this.clickOutsideIncludeIdList.findIndex(name => name.toLowerCase() === idName.toLowerCase()) !== -1) {
              // console.log('ID Name found');
              return false;
            }
          }

          /* CLASS */
          if (this.clickOutsideIncludeClassList.length > 0) {
            const classList = element.classList;

            if (classList !== undefined) {
              for (const className of this.clickOutsideIncludeClassList) {
                // if (this.ignoreClassList.findIndex(name => name.toLowerCase() === className.toLowerCase()) !== -1) {
                if (classList.contains(className)) {
                  // console.log('Class Name found');
                  return false;
                }
              }
            }
          }

        }
        return true;
      }),
      //
      // filter((target: HTMLElement) => {
      //   const el = this.hostElement.nativeElement as HTMLElement;
      //   const clickedInside = el.contains(target);
      //   return !clickedInside;
      // })
    ).subscribe(() => this.appClickOutside.emit());
  }


}
