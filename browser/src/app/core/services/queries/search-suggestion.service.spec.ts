import { TestBed } from '@angular/core/testing';

import { SearchSuggestionService } from './search-suggestion.service';

describe('SearchSuggestionService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SearchSuggestionService = TestBed.get(SearchSuggestionService);
    expect(service).toBeTruthy();
  });
});
