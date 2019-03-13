import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { SceneComponent } from './scene/scene.component';
import { MenuComponent } from './menu/menu.component';
import {FormsModule} from '@angular/forms';
import { DetailComponent } from './detail/detail.component';
import { TimesliderComponent } from './timeslider/timeslider.component';

import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {faCircleNotch, faClock, faCoffee, faPlayCircle, faStopCircle,
  faTimesCircle, faPoo, faGamepad, faSearch, faList, faVrCardboard} from '@fortawesome/free-solid-svg-icons';
import { SearchComponent } from './search/search.component';

@NgModule({
  declarations: [
    AppComponent,
    SceneComponent,
    MenuComponent,
    DetailComponent,
    TimesliderComponent,
    SearchComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    NgbModule,
    FormsModule,
    FontAwesomeModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
  constructor() {
    library.add(faCoffee);
    library.add(faPlayCircle);
    library.add(faStopCircle);
    library.add(faCircleNotch);
    library.add(faTimesCircle);
    library.add(faClock);
    library.add(faPoo);
    library.add(faGamepad);
    library.add(faSearch);
    library.add(faList);
    library.add(faVrCardboard);
  }
}
