import { TestBed } from '@angular/core/testing';

import { SearchtreeitemService } from './searchtreeitem.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('SearchtreeitemService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: SearchtreeitemService = TestBed.get(SearchtreeitemService);
    expect(service).toBeTruthy();
  });
});
