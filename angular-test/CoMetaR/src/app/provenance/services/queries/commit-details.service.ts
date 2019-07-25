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
    return this.dataService.getData(queryString, "commit details for commit "+commitid).pipe(map(data=> { return <CommitDetails[]> data }))
  };

  public getBySubject(subject:string):Observable<CommitDetails[]> {
    const queryString = this.getQueryString("?commit", subject);
    return this.dataService.getData(queryString, "commit details for subject "+subject).pipe(map(data=> { return <CommitDetails[]> data }))
  };

  public getQueryString(commit:string, subject?:string):string{
    return `#commit details
    ${prefixes}
SELECT DISTINCT ?subject ?sl ?predicate ?object ?ol ?addition (!bound(?p) as ?deprecatedsubject) ?date ?author
WHERE	
{
  ${commit} prov:qualifiedUsage ?usage ;
    prov:wasAssociatedWith ?author ;
    prov:endedAtTime ?date .
  ?usage ?addorremove ?statement .
  BIND(IF(?addorremove = cs:addition,true,false) as ?addition ) .
  ?statement a rdf:Statement; 
    rdf:subject ?subject;
    rdf:predicate ?predicate; 
    rdf:object ?object .
  FILTER NOT EXISTS { ?statement rdf:comment "hidden" } 
  
  #case of re-introduced concepts like "Sepsis"
  OPTIONAL {
  ?commit2 prov:qualifiedUsage ?usage2 ;
    prov:endedAtTime ?date2 .
    ?usage2 cs:addition [
      a rdf:Statement; 
      rdf:subject ?newsubject;
      rdf:predicate prov:wasDerivedFrom; 
      rdf:object ?subject 
    ]
  }
  FILTER(!bound(?date2) || ?date > ?date2)

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
  date:JSONResponsePartDate,
  author:JSONResponsePartString
}