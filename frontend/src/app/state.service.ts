import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {Edge, Vertex} from './model.service';
import {SearchResult} from './search.service';

/**
 * What should be in focus in the view
 */
export class FocusState {
  focusOn: SearchResult;
}

export class ControlState {
  showSearch = false;
  showTimeControls = false;
  vrMode = false;
}

export class StateModel {
  alarmsPerVertex = 0;
  situations = 0;
  flowSimulation = false;
  showInventory = true;
  showAlarms = true;
  showSituations = true;
  showLabels = true;
}

@Injectable({
  providedIn: 'root'
})
export class StateService {

  // Observable sources
  private spinning = new Subject<boolean>();
  private resetViewSubject = new Subject<boolean>();
  private stateModel = new Subject<StateModel>();
  private pointInTime = new Subject<number>();
  private controlState = new Subject<ControlState>();
  private focusState = new Subject<FocusState>();

  private activeElementSubject = new Subject<Vertex | Edge>();

  // Observable streams
  spinning$ = this.spinning.asObservable();
  resetView$ = this.resetViewSubject.asObservable();
  stateModel$ = this.stateModel.asObservable();
  activeElement$ = this.activeElementSubject.asObservable();
  pointInTime$ = this.pointInTime.asObservable();
  controlState$ = this.controlState.asObservable();
  focusState$ = this.focusState.asObservable();

  constructor() { }

  // Service message commands
  spin(spinning: boolean) {
    this.spinning.next(spinning);
  }

  resetView() {
    this.resetViewSubject.next(true);
  }

  updateStateModel(stateModel: StateModel) {
    this.stateModel.next(stateModel);
  }

  setActiveElement(el: Vertex | Edge) {
    this.activeElementSubject.next(el);
  }

  setPointInTimeMs(pointInTimeMs: number) {
    this.pointInTime.next(pointInTimeMs);
  }

  updateControlState(state: ControlState) {
    this.controlState.next(state);
  }

  updateFocusState(state: FocusState) {
    this.focusState.next(state);
  }
}
