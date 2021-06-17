import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { TestComponent } from './scenes/test/test.component';
import { HeaderComponent } from './components/header/header.component';
import { MainComponent } from './scenes/main/main.component';
import { ResizedDirective } from './directives/resize-event.directive';

@NgModule({
  declarations: [
    AppComponent,
    TestComponent,
    HeaderComponent,
    MainComponent,
    ResizedDirective
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
