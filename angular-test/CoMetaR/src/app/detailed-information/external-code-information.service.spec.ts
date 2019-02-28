import { TestBed } from '@angular/core/testing';

import { ExternalCodeInformationService } from './external-code-information.service';

describe('ExternalCodeInformationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ExternalCodeInformationService = TestBed.get(ExternalCodeInformationService);
    expect(service).toBeTruthy();
  });
});
