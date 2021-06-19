import {Subject} from 'rxjs';

import {ComponentType, OverlayRef} from '@angular/cdk/overlay';

import {TemplateRef} from '@angular/core';
import {Nullable} from '@babylonjs/core';

export interface OverlayCloseEvent<R> {
  type: 'backdropClick' | 'close';
  data: Nullable<R>;
}

// R = Response Data Type, T = Data passed to Modal Type
export class CustomOverlayRef<R = any, T = any> {
  afterClosed$ = new Subject<OverlayCloseEvent<R>>();

  constructor(
    public overlay: OverlayRef,
    public content: Nullable< TemplateRef<any> | ComponentType<any> >,
    public data: Nullable< T > // pass data to modal i.e. FormData
  ) {
    overlay.backdropClick().subscribe(() => this._close('backdropClick', null));
  }

  close(data: Nullable<R>): void {
    this._close('close', data);
  }

  private _close(type: 'backdropClick' | 'close', data: Nullable<R>): void {
    this.overlay.dispose();

    this.afterClosed$.next({
      type,
      data
    });

    this.afterClosed$.complete();
  }
}
