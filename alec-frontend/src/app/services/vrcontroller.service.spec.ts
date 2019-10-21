import { TestBed } from '@angular/core/testing';

import { VrcontrollerService } from './vrcontroller.service';

describe('VrcontrollerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VrcontrollerService = TestBed.get(VrcontrollerService);
    expect(service).toBeTruthy();
  });
});
