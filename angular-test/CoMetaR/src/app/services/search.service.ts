import { Injectable } from '@angular/core';
import { SearchtreeitemService, SearchResultAttributes } from './queries/searchtreeitem.service';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  public searchPattern$:Subject<string> = new Subject<string>();

  constructor(
    private searchtreeitemService: SearchtreeitemService
  ) { 
    this.searchPattern$.subscribe((pattern)=>{
      this.searchtreeitemService.get(pattern).subscribe((data)=>{
        this.searchResultAttributes$.next(data);
      })
    });
    this.searchResultAttributes$.subscribe((data)=>{
      this.searchResultAttributes=data;
      this.searchPathItems=data.map(e=>e.element.value);
    });
  }

  public searchResultAttributes$:Subject<SearchResultAttributes[]> = new Subject<SearchResultAttributes[]>();
  private searchResultAttributes:SearchResultAttributes[] = [];
  private searchPathItems:string[] = [];

  public getSearchPathItems():string[]{
    return this.searchPathItems;
  }
}
