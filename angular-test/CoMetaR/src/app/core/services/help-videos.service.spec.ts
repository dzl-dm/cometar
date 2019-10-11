import { TestBed } from '@angular/core/testing';

import { HelpVideosService } from './help-videos.service';

describe('HelpVideosService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: HelpVideosService = TestBed.get(HelpVideosService);
    expect(service).toBeTruthy();
  });
});
