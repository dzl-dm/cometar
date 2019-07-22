import { TestBed } from '@angular/core/testing';

import { ClientConfigurationService } from './client-configuration.service';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ClientConfigurationService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ RouterTestingModule, HttpClientTestingModule ]
  }));

  it('should be created', () => {
    const service: ClientConfigurationService = TestBed.get(ClientConfigurationService);
    expect(service).toBeTruthy();
  });
});
