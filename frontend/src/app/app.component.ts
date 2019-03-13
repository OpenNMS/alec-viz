import {Component, OnInit} from '@angular/core';
import {ControlState, StateService} from './state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';

  controlState = new ControlState();

  constructor(private stateService: StateService) {}

  ngOnInit(): void {
    this.stateService.controlState$.subscribe((state: ControlState) => {
      this.controlState = state;
    });
  }
}
