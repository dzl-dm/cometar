import { TestBed } from '@angular/core/testing';

import { CommitDetailsService } from './commit-details.service';

describe('CommitDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CommitDetailsService = TestBed.get(CommitDetailsService);
    expect(service).toBeTruthy();
  });
});
