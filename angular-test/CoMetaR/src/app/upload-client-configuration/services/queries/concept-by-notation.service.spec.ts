import { TestBed } from '@angular/core/testing';

import { ConceptByNotationService } from './concept-by-notation.service';

describe('ConceptByNotationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ConceptByNotationService = TestBed.get(ConceptByNotationService);
    expect(service).toBeTruthy();
  });
});
