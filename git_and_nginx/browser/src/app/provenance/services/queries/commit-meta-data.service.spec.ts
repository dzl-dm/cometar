import { TestBed } from '@angular/core/testing';

import { CommitMetaDataService } from './commit-meta-data.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('CommitMetaDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: CommitMetaDataService = TestBed.get(CommitMetaDataService);
    expect(service).toBeTruthy();
  });
});
