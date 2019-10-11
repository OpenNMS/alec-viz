import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-side-navbar',
  templateUrl: './side-navbar.component.html',
  styleUrls: ['./side-navbar.component.scss']
})
export class SideNavbarComponent implements OnInit {

  @Output() sideBarMinimzed = new EventEmitter<boolean>();
  minimized = true;

  constructor() { }

  minimizeSideBar(){
    this.minimized = !this.minimized;
    this.sideBarMinimzed.emit(this.minimized)
    alert(this.minimized)
  }

  ngOnInit() {
  }

}
