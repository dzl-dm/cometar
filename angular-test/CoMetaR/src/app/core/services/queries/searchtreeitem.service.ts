import { Injectable } from '@angular/core';
import { DataService, prefixes, JSONResponsePartUriString,  JSONResponsePartLangString } from '../../../services/data.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchtreeitemService {

  constructor(private dataService: DataService) { }

  public get(pattern: string): Observable<SearchResultAttributes[]> {
      if (pattern === '') { return of([]); }
      pattern = pattern.replace(/([\\'"])/g,"\\$1").replace(/([{}])/g,"\\\\$1");
      const queryString = this.getQueryString(pattern);
      return this.dataService.getData(queryString, 'search for pattern ' + pattern);
  }

  public getQueryString(pattern: string): string {
      return `#search for pattern...
${prefixes}
SELECT ?element ?property ?value
WHERE {
  ?element rdf:type ?t .
  FILTER (?t IN (skos:Concept, skos:Collection)) .
  FILTER EXISTS { ?root :topLevelNode [ skos:member* [ skos:narrower* [ rdf:hasPart? [ skos:narrower* ?element ] ] ] ] }
  {
    SELECT ?element ?property ?value
    WHERE {
      ?element ?property ?value FILTER (regex(?value, '${pattern}', 'i'))
    }
  }
  UNION
  {
    SELECT ?element ("Old Code" as ?property) (?oldnotation as ?value)
    WHERE {
      ?element prov:wasDerivedFrom+ ?oldconcept .
      ?cs a cs:ChangeSet ;
        cs:removal [
          a rdf:Statement;
          rdf:subject ?oldconcept;
          rdf:predicate skos:notation;
          rdf:object ?oldnotation
        ] .
      FILTER(regex(?oldnotation, '${pattern}', 'i'))
      FILTER NOT EXISTS { ?element skos:notation ?oldnotation }
    }
  }
}
ORDER BY ?element ?property  `;
  }
}

export interface SearchResultAttributes {
  element: JSONResponsePartUriString;
  property: JSONResponsePartUriString;
  value: JSONResponsePartLangString;
  /*label?:JSONResponsePartString,
  notation?:JSONResponsePartString,
  oldnotation?:JSONResponsePartString,
  altlabel?:JSONResponsePartString,
  description?:JSONResponsePartString,
  unit?:JSONResponsePartString,
  label2?:JSONResponsePartString,
  status?:JSONResponsePartString,
  creator?:JSONResponsePartString*/
}
