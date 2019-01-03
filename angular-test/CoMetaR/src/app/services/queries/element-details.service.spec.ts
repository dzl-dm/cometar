import { TestBed } from '@angular/core/testing';

import { ElementDetailsService } from './element-details.service';

describe('ElementDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ElementDetailsService = TestBed.get(ElementDetailsService);
    expect(service).toBeTruthy();
  });
});
