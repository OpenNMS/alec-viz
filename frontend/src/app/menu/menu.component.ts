import { Component, OnInit } from '@angular/core';
import {ControlState, StateModel, StateService} from '../state.service';
import {WebVRService} from '../webvr.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  // Shared
  controlState = new ControlState();
  stateModel = new StateModel();
  spinning = false;

  // Internal
  showModelOptions = false;
  vrAvailable = false;

  constructor(private stateService: StateService, private webVrService: WebVRService) {
    this.webVrService.vrAvailable$.subscribe(vrAvailable => {
      this.vrAvailable = vrAvailable;
    });
  }

  ngOnInit() {
  }

  onStateModelUpdated() {
    console.log('onStateModelUpdated', this.stateModel);
    this.stateService.updateStateModel(this.stateModel);
  }

  onClickSpin() {
    this.spinning = !this.spinning;
    this.stateService.spin(this.spinning);
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
}
