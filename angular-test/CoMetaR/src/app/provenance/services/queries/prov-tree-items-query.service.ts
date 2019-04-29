import { Injectable } from '@angular/core';
import { prefixes, DataService, JSONResponsePartUriString, JSONResponsePartDate } from 'src/app/services/data.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { flatMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProvTreeItemsQueryService {

  constructor(
    private dataService: DataService
  ) { }

  private fromDate$ = new BehaviorSubject<Date>(new Date(Date.now()));
  private result$ = this.fromDate$.pipe(flatMap(from => {
    const provItemsQueryString = this.getProvTreeItemsQueryString(from.toISOString(), new Date(Date.now()).toISOString());
    return this.dataService.getData(provItemsQueryString);
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
SELECT (?lastelement as ?element) ?date (?lastparent as ?parent) ?otherparent ?addorremove
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
?lastparent prov:wasDerivedFrom* ?someparent .
FILTER NOT EXISTS {
    ?anyparent prov:wasDerivedFrom ?lastparent
}
?lastelement prov:wasDerivedFrom* ?someelement .
FILTER NOT EXISTS {
    ?anyelement prov:wasDerivedFrom ?lastelement
}
    
FILTER (?addorremove IN (cs:addition,cs:removal) && ?narrower IN (skos:narrower, rdf:hasPart, skos:member, :topLevelNode, skos:hasTopConcept)) .
}
ORDER BY ?element ?date DESC(?addorremove)`;        
  }
}


export interface ProvTreeItemAttributes {
  element:JSONResponsePartUriString,
  date:JSONResponsePartDate,
  addorremove:JSONResponsePartUriString,
  parent:JSONResponsePartUriString
}