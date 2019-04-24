import { TestBed } from '@angular/core/testing';

import { GetDerivedConceptService } from './get-derived-concept.service';

describe('GetDerivedConceptService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GetDerivedConceptService = TestBed.get(GetDerivedConceptService);
    expect(service).toBeTruthy();
  });
});
