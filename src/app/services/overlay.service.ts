import {Injectable, Injector, TemplateRef, ViewContainerRef} from '@angular/core';
import {ComponentType, Overlay, OverlayConfig, OverlayRef} from '@angular/cdk/overlay';
import {ComponentPortal, PortalInjector, TemplatePortal} from '@angular/cdk/portal';
import {CustomOverlayRef} from '../models/CustomOverlayRef';
import {Nullable} from '@babylonjs/core';

@Injectable({
  providedIn: 'root'
})


/**
 * https://codinglatte.com/posts/angular/reusable-modal-overlay-using-angular-cdk-overlay/
 * https://juristr.com/blog/2018/05/dynamic-UI-with-cdk-portals/#demo
 * https://blog.thoughtram.io/angular/2017/11/20/custom-overlays-with-angulars-cdk.html
 */

export class OverlayService {
  constructor(public overlay: Overlay, private injector: Injector, ) {}

  // R = Response Data Type, T = Data passed to Modal Type
  openComponent<R = any, T = any>(
    component: ComponentType<any>,
    overlayConfig: Nullable<OverlayConfig> = null,
    data: Nullable<T> = null,
  ): CustomOverlayRef<R> {

    const overlayRef = this.createOverlayRef(overlayConfig);
    //
    const customOverlayRef = new CustomOverlayRef<R, T>(overlayRef, null, data);
    //
    const injector = this.createInjector(customOverlayRef, this.injector);

    overlayRef.attach(new ComponentPortal(component, null, injector));

    return customOverlayRef;
  }

  // R = Response Data Type, T = Data passed to Modal Type
  openTemplateRefInComponent<R = any, T = any>(
    templateRef: TemplateRef<any>,
    component: ComponentType<any>,
    overlayConfig: Nullable<OverlayConfig> = null,
    data: Nullable<T> = null,
  ): CustomOverlayRef<R> {

    const overlayRef = this.createOverlayRef(overlayConfig);

    const customOverlayRef = new CustomOverlayRef<R, T>(overlayRef, templateRef, data);

    const injector = this.createInjector(customOverlayRef, this.injector);

    overlayRef.attach(new ComponentPortal(component, null, injector));

    return customOverlayRef;
  }


  // R = Response Data Type, T = Data passed to Modal Type
  openComponentInComponent<R = any, T = any>(
    innerComponent: ComponentType<any>,
    outerComponent: ComponentType<any>,
    overlayConfig: Nullable<OverlayConfig> = null,
    data: Nullable<T> = null,
  ): CustomOverlayRef<R> {

    const overlayRef = this.createOverlayRef(overlayConfig);

    const customOverlayRef = new CustomOverlayRef<R, T>(overlayRef, innerComponent, data);

    const injector = this.createInjector(customOverlayRef, this.injector);

    overlayRef.attach(new ComponentPortal(outerComponent, null, injector));

    return customOverlayRef;
  }

// R = Response Data Type, T = Data passed to Modal Type
  openTemplateRef<R = any, T = any>(
    templateRef: TemplateRef<any>,
    viewContainerRef: ViewContainerRef,
    overlayConfig: Nullable<OverlayConfig> = null,
    // data: T = null
  ): OverlayRef {

    const overlayRef = this.createOverlayRef(overlayConfig);

    overlayRef.attach(new TemplatePortal(templateRef, viewContainerRef));

    return overlayRef;
  }

  private createOverlayRef(overlayConfig: Nullable<OverlayConfig> = null): OverlayRef  {

    if (overlayConfig == null) {
      overlayConfig = new OverlayConfig({
        hasBackdrop: true,
      });
    }

    return this.overlay.create(overlayConfig);
  }

  private createInjector(ref: CustomOverlayRef, inj: Injector): PortalInjector {
    const injectorTokens = new WeakMap([[CustomOverlayRef, ref]]);
    // inj.create
    // Injector.create()
    return new PortalInjector(inj, injectorTokens);
  }
}
