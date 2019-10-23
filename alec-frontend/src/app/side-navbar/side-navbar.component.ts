import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {ControlState, StateModel, StateService} from '../services/state.service';
import {WebVRService} from '../services/webvr.service';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrls: ['./side-navbar.component.scss']
})
export class SideNavbarComponent implements OnInit {

  @Output() sideBarMinimzed = new EventEmitter<boolean>();
  minimized = true;

   controlState = new ControlState();
   stateModel = new StateModel();
   spinning = false;

   showModelOptions = false;
   vrAvailable = false;
 
   constructor(private stateService: StateService, private webVrService: WebVRService) {
     this.webVrService.vrAvailable$.subscribe(vrAvailable => {
       this.vrAvailable = vrAvailable;
     });
   }

   onStateModelUpdated() {
    console.log('onStateModelUpdated', this.stateModel);
    this.stateService.updateStateModel(this.stateModel);
  }

  onClickSpin() {
    this.spinning = !this.spinning;
    this.stateService.spin(this.spinning);
  }

  onToggleContextControls() {
    this.controlState.showContextControls = !this.controlState.showContextControls;
    this.onControlStateUpdated();
  }

  onToggleTimeControls() {
    this.controlState.showTimeControls = !this.controlState.showTimeControls;
    this.onControlStateUpdated();
  }

  onToggleSearch() {
    this.controlState.showSearch = !this.controlState.showSearch;
    this.onControlStateUpdated();
  }

  onControlStateUpdated() {
    this.stateService.updateControlState(this.controlState);
  }

  onResetView() {
    this.stateService.resetView();
  }

  onToggleVR() {
    this.controlState.vrMode = !this.controlState.vrMode;
    this.onControlStateUpdated();
  }

  onToggleModelOptions() {
    this.showModelOptions = !this.showModelOptions;
  }
 
  /* Menu - End */

  minimizeSideBar(){
    this.minimized = !this.minimized;
    this.sideBarMinimzed.emit(this.minimized)
  }

  resetGraph(){
    console.log('reset called')
    this.stateService.resetView();
  }

  ngOnInit() {
  }

}
