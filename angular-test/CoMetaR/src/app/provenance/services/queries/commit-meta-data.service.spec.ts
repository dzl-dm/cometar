import { TestBed } from '@angular/core/testing';

import { CommitMetaDataService } from './commit-meta-data.service';

describe('CommitMetaDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CommitMetaDataService = TestBed.get(CommitMetaDataService);
    expect(service).toBeTruthy();
  });
});
