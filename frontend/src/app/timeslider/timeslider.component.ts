import { Component, OnInit } from '@angular/core';
import {StateService} from '../state.service';
import * as TWEEN from '@tweenjs/tween.js';
import {ModelMetadata, ModelService} from '../model.service';

@Component({
  selector: 'app-timeslider',
  templateUrl: './timeslider.component.html',
  styleUrls: ['./timeslider.component.css']
})
export class TimesliderComponent implements OnInit {

  pointInTimeMs = -1;
  modelMetadata: ModelMetadata;
  minTimeMs = 1546750837000;
  maxTimeMs = 1546837195000;

  playing = false;
  timeTween: any;
  tweenedTime = {x: 0};
  seekToMs: number;

  constructor(private stateService: StateService, private modelService: ModelService) { }

  ngOnInit() {
    this.pointInTimeMs = this.maxTimeMs;
    this.modelService.modelMetadata$.subscribe(modelMetadata => {
      this.onModelMetadataChanged(modelMetadata);
    });
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

  onSeek() {
    this.onStop();
    this.pointInTimeMs = this.seekToMs;
    this.onTimeChanged();
  }

  private onModelMetadataChanged(modelMetadata: ModelMetadata) {
    this.modelMetadata = modelMetadata;
    this.minTimeMs = modelMetadata.timeMetadata.startMs;
    this.maxTimeMs = modelMetadata.timeMetadata.endMs;
  }

}
