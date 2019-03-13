import { Component, OnInit } from '@angular/core';
import {StateService} from '../state.service';
import {Edge, Vertex} from '../model.service';

@Component({
  selector: 'app-detail',
  templateUrl: './detail.component.html',
  styleUrls: ['./detail.component.css']
})
export class DetailComponent implements OnInit {

  activeElement: Vertex | Edge;

  constructor(private stateService: StateService) {
    stateService.activeElement$.subscribe(activeElement => {
      this.activeElement = activeElement;
    });
  }

  ngOnInit() {
    // TODO: Unsub
  }

}
