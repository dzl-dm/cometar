import { TestBed } from '@angular/core/testing';

import { ProvTreeItemsQueryService } from './prov-tree-items-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ProvTreeItemsQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: ProvTreeItemsQueryService = TestBed.get(ProvTreeItemsQueryService);
    expect(service).toBeTruthy();
  });
});
