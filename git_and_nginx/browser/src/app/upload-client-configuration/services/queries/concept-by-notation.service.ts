import { Injectable } from '@angular/core';
import { DataService, prefixes, JSONResponsePartString, JSONResponsePartUriString, JSONResponsePartDate, JSONResponsePartLangString } from 'src/app/services/data.service';
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
  public get(notation:string,version_date:Date):Observable<IConceptByNotation> { 
    const queryString = this.getQueryString(notation,version_date);
    return this.dataService.getData(queryString, "newest concept and notation for "+notation+" since "+version_date.toISOString()).pipe(map(data=> <IConceptByNotation>data[0] || {}))
  };

  public getQueryString(notation:string,version_date:Date):string {
      return `#concept by notation
      ${prefixes}
      SELECT DISTINCT ?concept ?newnotation ?removedate ?new_concept_with_code ?new_concept_label
      WHERE
      {
          OPTIONAL {
            ?usage cs:removal [ a rdf:Statement;
              rdf:subject ?oldconcept;
              rdf:predicate skos:notation;
              rdf:object "${notation}"
            ] .
            ?commit prov:qualifiedUsage ?usage ;
              prov:endedAtTime ?removedate .
            FILTER (?removedate > "${version_date.toISOString()}"^^xsd:dateTime)
            ?concept skos:notation ?newnotation .
            ?concept prov:wasDerivedFrom* ?oldconcept .
            FILTER NOT EXISTS { ?concept skos:notation "${notation}" }
            OPTIONAL {
              ?new_concept_with_code skos:notation "${notation}";
                skos:prefLabel ?new_concept_label FILTER(lang(?new_concept_label)='en')
            }
          }
          OPTIONAL { ?concept skos:notation "${notation}". }
      }
      ORDER BY ?newnotation`;
  }
}

export interface IConceptByNotation {
  concept?:JSONResponsePartUriString,
  newnotation?:JSONResponsePartString,
  removedate?:JSONResponsePartDate,
  new_concept_with_code?:JSONResponsePartUriString,
  new_concept_label?:JSONResponsePartLangString
}