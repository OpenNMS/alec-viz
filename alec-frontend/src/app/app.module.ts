import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ChartsModule } from 'ng2-charts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatSliderModule } from '@angular/material';

import { AppComponent } from './app.component';
import { SideNavbarComponent } from './side-navbar/side-navbar.component';
import { HeaderComponent } from './header/header.component';
import { MetaDataService } from './services/meta-data.service';
import { ContentViewComponent } from './content-view/content-view.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    ChartsModule,
    BrowserAnimationsModule,
    MatSliderModule
  ],
  providers: [
    MetaDataService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
