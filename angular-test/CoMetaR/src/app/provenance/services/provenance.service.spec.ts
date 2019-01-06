import { TestBed } from '@angular/core/testing';

import { ProvenanceService } from './provenance.service';

describe('ProvenanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProvenanceService = TestBed.get(ProvenanceService);
    expect(service).toBeTruthy();
  });
});
