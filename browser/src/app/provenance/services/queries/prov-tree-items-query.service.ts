import { Injectable } from '@angular/core';
import { prefixes, DataService, JSONResponsePartUriString, JSONResponsePartDate, JSONResponsePartString } from 'src/app/services/data.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProvTreeItemsQueryService {

  constructor(
    private dataService: DataService
  ) { }

  public busy$ = new BehaviorSubject<boolean>(false);
  private busyQueries=0;
  private fromDate$ = new BehaviorSubject<Date>(new Date(Date.now()));
  private result$ = this.fromDate$.pipe(flatMap(from => {
    this.busyQueries++;
    this.busy$.next(true);
    const provItemsQueryString = this.getProvTreeItemsQueryString(from.toISOString(), new Date(Date.now()).toISOString());
    let o = this.dataService.getData(provItemsQueryString, "provenance of ontology items");
    o.subscribe(data => {
      this.busyQueries--;
      this.busy$.next(this.busyQueries>0);
    });
    return o;
  }))

  public setDate(from?:Date) {
    if (from) this.fromDate$.next(from);
  }

  public get(from?:Date):Observable<ProvTreeItemAttributes[]> {
    if (from) this.fromDate$.next(from);
    return this.result$;
  }
  
  private getProvTreeItemsQueryString(from:string,until:string):string{
    return `${prefixes}
SELECT (?lastelement as ?element) ?date (?lastparent as ?parent) ?addorremove ?label ?parentlabel (GROUP_CONCAT(?lastpreflabel;separator=",") as ?lastlabel)
WHERE {	          
?commit prov:qualifiedUsage ?cs ;
    prov:endedAtTime ?date .
    ${from&&until&&'FILTER (?date >= "'+from+'"^^xsd:dateTime && ?date <= "'+until+'"^^xsd:dateTime) .'||''}
?cs a cs:ChangeSet .

?cs ?addorremove [
    a rdf:Statement;
    rdf:subject ?someparent;
    rdf:predicate ?narrower;
    rdf:object ?someelement
] .
?lastparent prov:wasDerivedFrom* ?someparent.
FILTER NOT EXISTS {
    ?anyparent prov:wasDerivedFrom ?lastparent
}
?lastelement prov:wasDerivedFrom* ?someelement .
FILTER NOT EXISTS {
    ?anyelement prov:wasDerivedFrom ?lastelement
}
OPTIONAL {
  ?lastelement skos:prefLabel ?label FILTER (lang(?label)='en')
}
OPTIONAL {
  ?lastparent skos:prefLabel ?parentlabel FILTER (lang(?parentlabel)='en')
}
OPTIONAL {
  ?cs cs:removal [
    a rdf:Statement;
    rdf:subject ?someelement;
    rdf:predicate skos:prefLabel;
    rdf:object ?lastpreflabel
  ]
}
    
FILTER (?addorremove IN (cs:addition,cs:removal) && ?narrower IN (skos:narrower, rdf:hasPart, skos:member, :topLevelNode, skos:hasTopConcept)) .
}
GROUP BY ?lastelement ?date ?lastparent ?addorremove ?label ?parentlabel
HAVING (bound(?element) || ?label != "")
ORDER BY ?element ?date DESC(?addorremove)`;        
  }
}


export interface ProvTreeItemAttributes {
  element:JSONResponsePartUriString,
  date:JSONResponsePartDate,
  addorremove:JSONResponsePartUriString,
  parent:JSONResponsePartUriString,
  parentlabel?:JSONResponsePartString,
  label?:JSONResponsePartString,
  lastlabel?:JSONResponsePartString
}