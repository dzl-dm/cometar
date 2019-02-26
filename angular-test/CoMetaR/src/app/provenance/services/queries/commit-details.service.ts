import { Injectable } from '@angular/core';
import { prefixes, DataService, JSONResponsePartUriString, JSONResponsePartString, JSONResponsePartLangString, JSONResponsePartBoolean, JSONResponsePartDate } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommitDetailsService {

  constructor(
    private dataService:DataService
  ) { }

  public getByCommitId(commitid:string):Observable<CommitDetails[]> {
    const queryString = this.getQueryString("<"+commitid+">");
    return this.dataService.getData(queryString).pipe(map(data=> { return <CommitDetails[]> data }))
  };

  public getBySubject(subject:string):Observable<CommitDetails[]> {
    const queryString = this.getQueryString("?commit", subject);
    return this.dataService.getData(queryString).pipe(map(data=> { return <CommitDetails[]> data }))
  };

  private getQueryString(commit:string, subject?:string):string{
    return `
    ${prefixes}
SELECT DISTINCT ?subject ?sl ?predicate ?object ?ol ?addition (!bound(?p) as ?deprecatedsubject) ?date
WHERE	
{
  ${commit} prov:qualifiedUsage ?usage ;
  prov:endedAtTime ?date .
  ?usage ?addorremove ?statement .
  BIND(IF(?addorremove = cs:addition,true,false) as ?addition ) .
  ?statement a rdf:Statement; 
    rdf:subject ?subject;
    rdf:predicate ?predicate; 
    rdf:object ?object .
  FILTER NOT EXISTS { ?statement rdf:comment "hidden" } 
  FILTER NOT EXISTS { ?newsubject prov:wasDerivedFrom+ ?subject }
  OPTIONAL { ?subject skos:prefLabel ?sl filter (lang(?sl)='en') . }
  OPTIONAL { ?object skos:prefLabel ?ol filter (lang(?ol)='en') . }
  
  #identifying deprecated subjects
  OPTIONAL {
    ?subject ?p ?o
  }
  FILTER (
    bound(?predicate)
  )
  ${subject?"FILTER (?subject = <" + subject + ">).":"" }
}
ORDER BY ?subject DESC(?date) ?predicate lang(?object) ?date ?addition`
  }
}

export interface CommitDetails {
  subject:JSONResponsePartUriString,
  sl:JSONResponsePartLangString,
  predicate:JSONResponsePartUriString,
  object:JSONResponsePartLangString,
  ol:JSONResponsePartLangString,
  addition:JSONResponsePartBoolean,
  deprecatedsubject:JSONResponsePartBoolean,
  date:JSONResponsePartDate
}