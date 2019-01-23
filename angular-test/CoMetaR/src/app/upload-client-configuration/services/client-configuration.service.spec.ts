import { TestBed } from '@angular/core/testing';

import { ClientConfigurationService } from './client-configuration.service';

describe('ClientConfigurationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ClientConfigurationService = TestBed.get(ClientConfigurationService);
    expect(service).toBeTruthy();
  });
});
