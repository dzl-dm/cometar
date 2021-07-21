import { TestBed } from '@angular/core/testing';

import { TreeIconsQueryService } from './tree-icons-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('TreeIconsQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
  }));

  it('should be created', () => {
    const service: TreeIconsQueryService = TestBed.get(TreeIconsQueryService);
    expect(service).toBeTruthy();
  });
});
