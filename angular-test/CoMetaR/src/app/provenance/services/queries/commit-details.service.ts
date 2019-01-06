import { Injectable } from '@angular/core';
import { prefixes, DataService, JSONResponsePartUriString, JSONResponsePartString, JSONResponsePartLangString } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommitDetailsService {

  constructor(
    private dataService:DataService
  ) { }

  public get(commitid:string):Observable<CommitDetails[]> {
    const queryString = this.getQueryString(commitid);
    return this.dataService.getData(queryString).pipe(map(data=> { return <CommitDetails[]> data }))
  };

  private getQueryString(commitid:string):string{
    return `
    ${prefixes}
    SELECT DISTINCT ?subject ?sl ?predicate ?oldobject ?ool ?newobject ?nol
    WHERE	
    {
      <${commitid}> prov:qualifiedUsage ?usage .
      ?usage ?addorremove [ a rdf:Statement; rdf:subject ?subject ] .
      OPTIONAL {?usage cs:addition ?add .
        ?add a rdf:Statement; 
          rdf:subject ?subject; 
          rdf:predicate ?predicate; 
          rdf:object ?newobject .
        OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
        OPTIONAL { ?newobject skos:prefLabel ?nol filter (isLiteral(?newobject) || lang(?nol)='en') . }
        FILTER NOT EXISTS { ?add rdf:comment "hidden" } 
        FILTER NOT EXISTS { ?newsubject prov:wasDerivedFrom+ ?subject } 
      }		
      OPTIONAL { ?usage cs:removal ?rem .
        ?rem a rdf:Statement; 
          rdf:subject ?subject; 
          rdf:predicate ?predicate; 
          rdf:object ?oldobject .
        OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
        OPTIONAL { ?oldobject skos:prefLabel ?ool filter (isLiteral(?oldobject) || lang(?ool)='en') . }
        FILTER NOT EXISTS { ?rem rdf:comment "hidden" } 
        FILTER NOT EXISTS { ?newsubject prov:wasDerivedFrom+ ?subject } 
      }
      filter (!bound(?oldobject) || !bound(?newobject) || !isLiteral(?oldobject) || !isLiteral(?newobject) || lang(?oldobject) = lang(?newobject))
    }
    ORDER BY ?sl ?subject ?predicate ?oldobject`
  }
}

export interface CommitDetails {
  subject:JSONResponsePartUriString,
  sl:JSONResponsePartLangString,
  predicate:JSONResponsePartUriString,
  oldobject:JSONResponsePartUriString,
  ool:JSONResponsePartLangString,
  newobject:JSONResponsePartUriString,
  nol:JSONResponsePartLangString
}