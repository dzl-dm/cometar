import { TestBed } from '@angular/core/testing';

import { OntologyAccessService } from './ontology-access.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('OntologyAccessService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: OntologyAccessService = TestBed.get(OntologyAccessService);
    expect(service).toBeTruthy();
  });
});
