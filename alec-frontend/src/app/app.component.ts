import { Component } from '@angular/core';
import {NgbPaginationModule, NgbAlertModule} from '@ng-bootstrap/ng-bootstrap';
import {NgbDateAdapter, NgbDateNativeAdapter} from '@ng-bootstrap/ng-bootstrap';

import {NgbTimepickerConfig, NgbDateStruct} from '@ng-bootstrap/ng-bootstrap';
import {NgbTimeStruct, NgbCalendar} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'alec-frontend';
  isSideBarMinimized = true;
  isSideBarVisible = true;

  minimizeSideBar(sideBarStatus){
    this.isSideBarMinimized = sideBarStatus;
  }

  displaySideBar(sideBarStatus){
    this.isSideBarVisible = sideBarStatus;
    // alert(this.isSideBarVisible)
  }

  time: NgbTimeStruct = {hour: 13, minute: 30, second: 0};

  constructor(config: NgbTimepickerConfig, private calendar: NgbCalendar) { 
     // customize default values of ratings used by this component tree
     config.seconds = false;
     config.spinners = false;
  }

  model1: Date;
  model2: any = {
    "year": 2019,
    "month": 10,
    "day": 23
  }
  model: NgbDateStruct;

  get today() {
    return new Date();
  }
}
