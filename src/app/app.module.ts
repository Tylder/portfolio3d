import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import {TestComponent} from './scenes/test/test.component';
import {HeaderComponent} from './components/header/header.component';
import {MainComponent} from './scenes/main/main.component';
import {ResizedDirective} from './directives/resize-event.directive';
import {EmailModalComponent} from './components/email-modal/email-modal.component';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    HeaderComponent,
    MainComponent,
    ResizedDirective,
    EmailModalComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
