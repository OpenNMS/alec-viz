import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TimesliderComponent } from './timeslider.component';
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {FormsModule} from '@angular/forms';

describe('TimesliderComponent', () => {
  let component: TimesliderComponent;
  let fixture: ComponentFixture<TimesliderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TimesliderComponent ],
      imports: [ FontAwesomeModule, FormsModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TimesliderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
