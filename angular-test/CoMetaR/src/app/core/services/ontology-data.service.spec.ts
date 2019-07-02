import { TestBed } from '@angular/core/testing';

import { OntologyDataService } from './ontology-data.service';

describe('OntologyDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: OntologyDataService = TestBed.get(OntologyDataService);
    expect(service).toBeTruthy();
  });
});
