import { TestBed } from '@angular/core/testing';

import { TreeIconsQueryService } from './tree-icons-query.service';

describe('TreeIconsQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeIconsQueryService = TestBed.get(TreeIconsQueryService);
    expect(service).toBeTruthy();
  });
});
