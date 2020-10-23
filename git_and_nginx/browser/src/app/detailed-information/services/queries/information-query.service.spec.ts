import { TestBed } from '@angular/core/testing';

import { InformationQueryService } from './information-query.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('InformationQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
  }));

  it('should be created', () => {
    const service: InformationQueryService = TestBed.get(InformationQueryService);
    expect(service).toBeTruthy();
  });
});
