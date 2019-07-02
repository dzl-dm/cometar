import { TestBed } from '@angular/core/testing';

import { OntologyAccessService } from './ontology-access.service';

describe('OntologyAccessService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OntologyAccessService = TestBed.get(OntologyAccessService);
    expect(service).toBeTruthy();
  });
});
