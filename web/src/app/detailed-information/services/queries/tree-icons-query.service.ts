import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartUriString, JSONResponsePartBoolean, JSONResponsePartNumber } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map, mergeMap } from 'rxjs/operators';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class TreeIconsQueryService {

  constructor(
    private dataService: DataService,
    private configurationService: ConfigurationService
  ) { }

  public get():Observable<TreeIconsQueryData[]> {
    return this.configurationService.configurationLoaded$.pipe(
      mergeMap(()=>{
        const queryString = this.getQueryString();
        return this.dataService.getData(queryString, "draft and editorialnote elements")
          .pipe(
            map(data => { 
              return <TreeIconsQueryData[]>data 
            })
          )
      })
      
    )
  };

  private getQueryString(iri?):string {
      return `#draft and editorialnote elements
      ${this.dataService.prefixes}
      SELECT DISTINCT ?element (COUNT(?status) = 1 as ?draft) (COUNT(?editnote) as ?editnotes)
      WHERE {	      
        ?element rdf:type ?type .    
        OPTIONAL { ?element <${this.configurationService.settings.rdf.status_iri}> ?status FILTER (?status = 'draft'). }
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
