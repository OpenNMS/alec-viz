import { Component, OnInit } from '@angular/core';
import {StateService} from '../state.service';
import * as TWEEN from '@tweenjs/tween.js';

@Component({
  selector: 'app-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.css']
})
export class TimesliderComponent implements OnInit {

  pointInTimeMs = -1;
  minTimeMs = 1546750837000;
  maxTimeMs = 1546837195000;

  playing = false;
  timeTween: any;
  tweenedTime = {x: 0};

  constructor(private stateService: StateService) { }

  ngOnInit() {
    this.pointInTimeMs = this.maxTimeMs;
  }

  onTimeChanged() {
    this.stateService.setPointInTimeMs(this.pointInTimeMs);
  }

  onPlay() {
    let lastTimeChange = 0;
    const self = this;
    this.tweenedTime.x = this.minTimeMs;
    this.timeTween = new TWEEN.Tween( this.tweenedTime ).to( {
      x: this.maxTimeMs}, 30000 )
      .easing(TWEEN.Easing.Linear.None)
      .repeat(Infinity)
      .onUpdate(function() {
        const now = new Date().getTime();
        if (now - lastTimeChange > 1000) {
          lastTimeChange = now;
          self.pointInTimeMs = Math.floor(self.tweenedTime.x);
          self.onTimeChanged();
        }
      });
    this.timeTween.start();
    this.playing = true;
  }

  onStop() {
    if (this.timeTween !== undefined) {
      this.timeTween.stop();
    }
    this.playing = false;
  }

}
