import { TestBed } from '@angular/core/testing';

import { VRControllerService } from './vrcontroller.service';

describe('VrcontrollerService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: VRControllerService = TestBed.get(VRControllerService);
    expect(service).toBeTruthy();
  });
});
