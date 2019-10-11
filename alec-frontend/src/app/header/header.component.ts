import { Component, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {

  @Output() sideBarStatus = new EventEmitter<boolean>();
  showSideBar = true;

  constructor() { }

  sideBarDisplay(){
    this.showSideBar = !this.showSideBar;
    this.sideBarStatus.emit(this.showSideBar);
    alert(this.showSideBar)
  }

  ngOnInit() { 
  }

}
