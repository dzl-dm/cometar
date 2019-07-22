import { TestBed } from '@angular/core/testing';

import { TreeStyleService } from './tree-style.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatIconRegistry } from '@angular/material';

describe('TreeStyleService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
    providers: [MatIconRegistry]
  }));

  it('should be created', () => {
    const service: TreeStyleService = TestBed.get(TreeStyleService);
    expect(service).toBeTruthy();
  });
});
