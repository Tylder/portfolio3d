import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {MainComponent} from './components/main/main.component';
import {ResizedDirective} from './directives/resize-event.directive';
import {FlexLayoutModule} from '@angular/flex-layout';
import {ClipboardModule} from '@angular/cdk/clipboard';
import {ClickableDirective} from './directives/clickable.directive';
import {ClickOutsideDirective} from './directives/click-outside.directive';
import {ProjectsComponent} from './components/projects/projects.component';
import {SubProjectComponent} from './components/sub-project/sub-project.component';


@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    ResizedDirective,
    ClickableDirective,
    ClickOutsideDirective,
    ProjectsComponent,
    SubProjectComponent
  ],
  imports: [
    BrowserModule,
    FlexLayoutModule,
    ClipboardModule,
  ],
  providers: [
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
