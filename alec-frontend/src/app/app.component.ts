import { Component } from '@angular/core';

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
  }
}
