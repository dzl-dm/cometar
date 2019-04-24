import { TestBed } from '@angular/core/testing';

import { GetRemovedConceptService } from './get-removed-concept.service';

describe('GetRemovedConceptService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GetRemovedConceptService = TestBed.get(GetRemovedConceptService);
    expect(service).toBeTruthy();
  });
});
