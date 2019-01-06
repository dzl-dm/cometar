import { TestBed } from '@angular/core/testing';

import { TreeItemsService } from './treeitems.service';

describe('ToplevelelementsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeItemsService = TestBed.get(TreeItemsService);
    expect(service).toBeTruthy();
  });
});
