import { TestBed } from '@angular/core/testing';

import { CommitHistoryService } from './commit-history.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommitHistoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: CommitHistoryService = TestBed.get(CommitHistoryService);
    expect(service).toBeTruthy();
  });
});
