import { TestBed } from '@angular/core/testing';

import { InformationQueryService } from './information-query.service';

describe('InformationQueryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: InformationQueryService = TestBed.get(InformationQueryService);
    expect(service).toBeTruthy();
  });
});
