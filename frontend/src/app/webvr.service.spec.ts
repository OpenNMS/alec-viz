import { TestBed } from '@angular/core/testing';

import { WebVRService } from './webvr.service';

describe('WebvrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebVRService = TestBed.get(WebVRService);
    expect(service).toBeTruthy();
  });
});
