import { TestBed, inject } from '@angular/core/testing';

import { ConceptByNotationService } from './concept-by-notation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ConceptByNotationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ]
  }));
  let service: ConceptByNotationService;

  it('should be created', () => {
    const service: ConceptByNotationService = TestBed.get(ConceptByNotationService);
    expect(service).toBeTruthy();
  });

  it('should contain', 
    inject([ConceptByNotationService],(conceptByNotationService) => {
      conceptByNotationService.get("test",new Date("2019-07-01")).subscribe((data) => {
        expect(data);
      })
    })
  );
});
