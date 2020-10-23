import { TestBed } from '@angular/core/testing';

import { ProvTreeItemsService } from './prov-tree-items.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('ProvTreeItemsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule, RouterTestingModule ]
  }));

  it('should be created', () => {
    const service: ProvTreeItemsService = TestBed.get(ProvTreeItemsService);
    expect(service).toBeTruthy();
  });
});
