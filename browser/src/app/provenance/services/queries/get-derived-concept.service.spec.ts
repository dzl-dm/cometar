import { TestBed } from '@angular/core/testing';

import { GetDerivedConceptService } from './get-derived-concept.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetDerivedConceptService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: GetDerivedConceptService = TestBed.get(GetDerivedConceptService);
    expect(service).toBeTruthy();
  });
});
