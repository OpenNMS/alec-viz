import { Component, OnInit } from '@angular/core';
import {StateService} from '../state.service';
import {Edge, Model, ModelService, Vertex} from '../model.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {

  model: Model;
  activeElement: Vertex | Edge;
  pointInTimeMs: number;

  constructor(private modelService: ModelService, private stateService: StateService) {
    this.modelService.getModel().subscribe((model: Model) => {
      this.onModelUpdated(model);
    });

    stateService.activeElement$.subscribe(activeElement => {
      this.activeElement = activeElement;
    });

    this.pointInTimeMs = new Date().getTime();
    stateService.pointInTime$.subscribe(pointInTimeMs => {
      this.pointInTimeMs = pointInTimeMs;
    });
  }

  private onModelUpdated(model: Model) {
    this.model = model;

  }

  setTime(timestamp: number|string) {
    if (typeof timestamp === 'string') {
      this.stateService.setPointInTimeMs(Number(timestamp));
    } else {
      this.stateService.setPointInTimeMs(<number>timestamp);
    }
  }

  addToFocus(el: Vertex | Edge) {
    this.stateService.addToFocus(el);
  }

  ngOnInit() {
    // TODO: Unsub
  }

}
