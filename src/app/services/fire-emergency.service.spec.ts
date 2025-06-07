import { TestBed } from '@angular/core/testing';

import { FireEmergencyService } from './fire-emergency.service';

describe('FireEmergencyService', () => {
  let service: FireEmergencyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FireEmergencyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
