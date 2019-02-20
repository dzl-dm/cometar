import { Injectable } from '@angular/core';
import { DataService, prefixes, JSONResponsePartString, JSONResponsePartUriString } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConceptByNotationService {

  constructor(private dataService: DataService) { }

  /**
   * 
   * @param {string[]} iris
   */
  public get(notation:string):Observable<IConceptByNotation> { 
    const queryString = this.getQueryString(notation);
    return this.dataService.getData(queryString).pipe(map(data=> <IConceptByNotation>data[0] || {}))
  };

  private getQueryString(notation:string):string {
      return `
      ${prefixes}
      SELECT DISTINCT ?concept ?newnotation
      WHERE
      {
          OPTIONAL { ?concept skos:notation "${notation}". }
          OPTIONAL {
            ?usage cs:removal [ a rdf:Statement;
              rdf:subject ?oldconcept;
              rdf:predicate skos:notation;
              rdf:object "${notation}"
            ] .
            ?concept skos:notation ?newnotation .
            ?concept prov:wasDerivedFrom+ ?oldconcept .
            FILTER NOT EXISTS { ?concept skos:notation "${notation}" }
          }
      }`;
  }
}

export interface IConceptByNotation {
  concept?:JSONResponsePartUriString,
  newnotation?:JSONResponsePartString
}