import { Injectable } from '@angular/core';
import {EventManager} from '@angular/platform-browser';
import {Subject} from 'rxjs/internal/Subject';

@Injectable({
  providedIn: 'root'
})
export class WebVRService {

  private vrAvailable = new Subject<boolean>();
  vrAvailable$ = this.vrAvailable.asObservable();

  public vrDisplay: VRDisplay;

  constructor(private eventManager: EventManager) {
    this.eventManager.addGlobalEventListener('window', 'vrdisplayconnect', (event: any) => {
      this.onVRDisplayConnected(event.display);
    });
  }

  public onVRDisplayConnected(vrDisplay: any) {
    console.log('onVRDisplayConnected!', vrDisplay);
    this.vrAvailable.next(true);
    this.vrDisplay = vrDisplay;
  }
}
