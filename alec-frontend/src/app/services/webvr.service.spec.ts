import { TestBed } from '@angular/core/testing';

import { WebvrService } from './webvr.service';

describe('WebvrService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WebvrService = TestBed.get(WebvrService);
    expect(service).toBeTruthy();
  });
});
