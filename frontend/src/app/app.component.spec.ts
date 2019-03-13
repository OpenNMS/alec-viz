import {async, TestBed} from '@angular/core/testing';

import {AppComponent} from './app.component';
import {Component} from '@angular/core';
import {DetailComponent} from './detail/detail.component';

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AppComponent,
        MockMenuComponent,
        MockSceneComponent,
        MockTimesliderComponent,
        MockSearchComponent,
        DetailComponent
      ],
    }).compileComponents();
  }));

  it('should create the app', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }));

  it(`should have as title 'app'`, async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual('app');
  }));

  it('should render title in a h1 tag', async(() => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('div')).toBeDefined();
  }));
});

@Component({
  selector: 'app-menu',
  template: ''
})
class MockMenuComponent {
}

@Component({
  selector: 'app-scene',
  template: ''
})
class MockSceneComponent {
}

@Component({
  selector: 'app-timeslider',
  template: ''
})
class MockTimesliderComponent {
}

@Component({
  selector: 'app-search',
  template: ''
})
class MockSearchComponent {
}
