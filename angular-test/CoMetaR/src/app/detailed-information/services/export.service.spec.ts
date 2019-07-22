import { TestBed } from '@angular/core/testing';

import { ExportService } from './export.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('ExportService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [ HttpClientTestingModule ],
  }));

  it('should be created', () => {
    const service: ExportService = TestBed.get(ExportService);
    expect(service).toBeTruthy();
  });
});
