import { TestBed, inject } from '@angular/core/testing';

import { ConceptByNotationService } from './concept-by-notation.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { HttpClientModule } from '@angular/common/http';

fdescribe('ConceptByNotationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientModule ]
  }));
  let service: ConceptByNotationService;

  it('should be created', () => {
    const service: ConceptByNotationService = TestBed.get(ConceptByNotationService);
    expect(service).toBeTruthy();
  });

  it('should not show new code for S:91302008 since 2019-07-01', (done) => {    
    const service: ConceptByNotationService = TestBed.get(ConceptByNotationService);
    service.get("S:91302008",new Date("2019-07-01")).subscribe((data) => {
      console.log(data);
      expect(data.concept.value).toEqual("http://purl.bioontology.org/ontology/SNOMEDCT/91302008");
      done();
    })
  });

  it('should show new code for S:91302008 since 2019-05-01', (done) => {    
    const service: ConceptByNotationService = TestBed.get(ConceptByNotationService);
    service.get("S:91302008",new Date("2019-05-01")).subscribe((data) => {
      console.log(data);
      expect(data.concept.value).not.toEqual("http://purl.bioontology.org/ontology/SNOMEDCT/91302008");
      expect(data.newnotation).toBeTruthy();
      done();
    })
  });
});
