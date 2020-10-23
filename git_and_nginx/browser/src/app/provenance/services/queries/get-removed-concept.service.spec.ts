import { TestBed } from '@angular/core/testing';

import { GetRemovedConceptService } from './get-removed-concept.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('GetRemovedConceptService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: GetRemovedConceptService = TestBed.get(GetRemovedConceptService);
    expect(service).toBeTruthy();
  });
});
