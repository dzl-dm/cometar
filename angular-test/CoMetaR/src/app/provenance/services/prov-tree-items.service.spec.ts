import { TestBed } from '@angular/core/testing';

import { ProvTreeItemsService } from './prov-tree-items.service';

describe('ProvTreeItemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ProvTreeItemsService = TestBed.get(ProvTreeItemsService);
    expect(service).toBeTruthy();
  });
});
