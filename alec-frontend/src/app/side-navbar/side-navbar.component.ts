import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import {StateService} from '../services/state.service';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrls: ['./side-navbar.component.scss']
})
export class SideNavbarComponent implements OnInit {

  @Output() sideBarMinimzed = new EventEmitter<boolean>();
  minimized = true;

  constructor(private stateService: StateService) {}

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
