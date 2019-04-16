import { TestBed } from '@angular/core/testing';

import { ProvTreeItemsQueryService } from './prov-tree-items-query.service';

describe('ProvTreeItemsQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProvTreeItemsQueryService = TestBed.get(ProvTreeItemsQueryService);
    expect(service).toBeTruthy();
  });
});
