import { TestBed } from '@angular/core/testing';

import { ComponentStateService } from './component-state.service';

describe('ComponentStateService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ComponentStateService = TestBed.get(ComponentStateService);
    expect(service).toBeTruthy();
  });
});
