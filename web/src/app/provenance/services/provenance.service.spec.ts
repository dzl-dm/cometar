import { TestBed } from '@angular/core/testing';

import { ProvenanceService } from './provenance.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProvenanceService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule, RouterTestingModule ]
  }));

  it('should be created', () => {
    const service: ProvenanceService = TestBed.get(ProvenanceService);
    expect(service).toBeTruthy();
  });
});
