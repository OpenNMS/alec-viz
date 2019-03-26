import { Component, OnInit } from '@angular/core';
import {ContextModel, StateService} from '../state.service';

@Component({
  selector: 'app-context',
  templateUrl: './context.component.html',
  styleUrls: ['./context.component.css']
})
export class ContextComponent implements OnInit {
  private contextModel = new ContextModel();

  constructor(private stateService: StateService) { }

  ngOnInit() {
  }

  onContextChanged() {
    this.stateService.updateContextModel(this.contextModel);
  }
}
