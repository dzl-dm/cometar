import { TestBed } from '@angular/core/testing';

import { CommitDetailsService } from './commit-details.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommitDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: CommitDetailsService = TestBed.get(CommitDetailsService);
    expect(service).toBeTruthy();
  });
});
