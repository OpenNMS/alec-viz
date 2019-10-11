import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { SideNavbarComponent } from './side-navbar/side-navbar.component';
import { HeaderComponent } from './header/header.component';
import { ContentViewComponent } from './content-view/content-view.component';

@NgModule({
  declarations: [
    AppComponent,
    SideNavbarComponent,
    HeaderComponent,
    ContentViewComponent
  ],
  imports: [
    NgbModule,
    FormsModule,  
    BrowserModule,
    ChartsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
