import { TestBed } from '@angular/core/testing';

import { TreestateService } from './treestate.service';

describe('TreestateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TreestateService = TestBed.get(TreestateService);
    expect(service).toBeTruthy();
  });
});
