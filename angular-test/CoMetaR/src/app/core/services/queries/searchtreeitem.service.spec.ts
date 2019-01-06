import { TestBed } from '@angular/core/testing';

import { SearchtreeitemService } from './searchtreeitem.service';

describe('SearchtreeitemService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SearchtreeitemService = TestBed.get(SearchtreeitemService);
    expect(service).toBeTruthy();
  });
});
