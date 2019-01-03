import { TestBed } from '@angular/core/testing';

import { TreeStyleService } from './tree-style.service';

describe('TreeStyleService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreeStyleService = TestBed.get(TreeStyleService);
    expect(service).toBeTruthy();
  });
});
