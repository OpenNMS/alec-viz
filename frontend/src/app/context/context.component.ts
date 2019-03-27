import {Component, OnInit} from '@angular/core';
import {ContextModel, StateService} from '../state.service';

@Component({
  selector: 'app-context',
  templateUrl: './context.component.html',
  styleUrls: ['./context.component.css']
})
export class ContextComponent implements OnInit {
  private contextModel = new ContextModel();

  constructor(private stateService: StateService) {
    this.stateService.addToFocus$.subscribe(el => {
      this.contextModel.focalPoint = el.label;
      this.onContextChanged();
    });
  }

  ngOnInit() {
  }

  onContextChanged() {
    this.stateService.updateContextModel(this.contextModel);
  }
}
