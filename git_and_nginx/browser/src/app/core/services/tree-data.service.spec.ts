import { TestBed } from '@angular/core/testing';

import { TreeDataService } from './tree-data.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';

describe('TreeDataService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule, RouterTestingModule ]
  }));

  it('should be created', () => {
    const service: TreeDataService = TestBed.get(TreeDataService);
    expect(service).toBeTruthy();
  });
});
