import { TestBed } from '@angular/core/testing';

import { TreepathitemsService } from './treepathitems.service';

describe('TreepathitemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreepathitemsService = TestBed.get(TreepathitemsService);
    expect(service).toBeTruthy();
  });
});
