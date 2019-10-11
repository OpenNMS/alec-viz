import { Component } from '@angular/core';
import {NgbTimeStruct, NgbCalendar, NgbTimepickerConfig, NgbDateStruct, NgbPaginationModule, NgbAlertModule, NgbDateAdapter, NgbDateNativeAdapter} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'alec-frontend';
  isSideBarMinimized = true;
  isSideBarVisible = true;
  
  time: NgbTimeStruct = {hour: 13, minute: 30, second: 0};
  model1: Date;
  model2: any = {
    "year": 2019,
    "month": 10,
    "day": 23
  }
  model: NgbDateStruct;
  
  constructor(config: NgbTimepickerConfig, private calendar: NgbCalendar) { 
     config.seconds = false;
     config.spinners = false;
  }
  
  minimizeSideBar(sideBarStatus){
    this.isSideBarMinimized = sideBarStatus;
  }

  displaySideBar(sideBarStatus){
    this.isSideBarVisible = sideBarStatus;
  }

  get today() {
    return new Date();
  }
}
