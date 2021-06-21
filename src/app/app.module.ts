import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {HeaderComponent} from './components/header/header.component';
import {MainComponent} from './scenes/main/main.component';
import {ResizedDirective} from './directives/resize-event.directive';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {ClickableDirective} from './directives/clickable.directive';
import {ClickOutsideDirective} from './directives/click-outside.directive';

/** Include any modalComponents in this list */


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    MainComponent,
    ResizedDirective,
    ClickableDirective,
    ClickOutsideDirective
  ],
  imports: [
    BrowserModule,
    FlexLayoutModule,
    ClipboardModule
  ],
  entryComponents: [
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
