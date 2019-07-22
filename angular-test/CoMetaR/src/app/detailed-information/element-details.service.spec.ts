import { TestBed } from '@angular/core/testing';

import { ElementDetailsService } from './element-details.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ElementDetailsService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
  }));

  it('should be created', () => {
    const service: ElementDetailsService = TestBed.get(ElementDetailsService);
    expect(service).toBeTruthy();
  });
});
