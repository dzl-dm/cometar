import { TestBed } from '@angular/core/testing';

import { OntologyDataService } from './ontology-data.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('OntologyDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: OntologyDataService = TestBed.get(OntologyDataService);
    expect(service).toBeTruthy();
  });
});
