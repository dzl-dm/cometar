import { TestBed } from '@angular/core/testing';

import { CommitHistoryService } from './commit-history.service';

describe('CommitHistoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CommitHistoryService = TestBed.get(CommitHistoryService);
    expect(service).toBeTruthy();
  });
});
