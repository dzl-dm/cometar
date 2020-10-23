import { Injectable } from '@angular/core';
import { DataService, prefixes, JSONResponsePartUriString, JSONResponsePartString, JSONResponsePartBoolean, JSONResponsePartNumber } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreeIconsQueryService {

  constructor(private dataService: DataService) { }

  public get():Observable<TreeIconsQueryData[]> {
    const queryString = this.getQueryString();
    return this.dataService.getData(queryString, "draft and editorialnote elements").pipe(map(data => { return <TreeIconsQueryData[]>data }));
  };

  private getQueryString(iri?):string {
      return `#draft and editorialnote elements
      ${prefixes}
      SELECT DISTINCT ?element (COUNT(?status) = 1 as ?draft) (COUNT(?editnote) as ?editnotes)
      WHERE {	      
        ?element rdf:type ?type .    
        OPTIONAL { ?element :status ?status FILTER (?status = 'draft'). }
        OPTIONAL { ?element skos:editorialNote ?editnote . }
        FILTER(bound(?status) || bound(?editnote))
      } 
      GROUP BY ?element
      `;
  }
}

export interface TreeIconsQueryData {
  element:JSONResponsePartUriString,
  draft:JSONResponsePartBoolean,
  editnotes:JSONResponsePartNumber
}
