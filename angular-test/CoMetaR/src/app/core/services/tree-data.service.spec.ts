import { TestBed } from '@angular/core/testing';

import { TreeDataService } from './tree-data.service';

describe('TreeDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeDataService = TestBed.get(TreeDataService);
    expect(service).toBeTruthy();
  });
});
