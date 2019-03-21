import { Injectable } from '@angular/core';
import { DataService, JSONResponsePartDate, JSONResponsePartNumber, prefixes } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommitHistoryService {
  constructor(
    private dataService:DataService
  ) { }

  public get(from?:Date, until:Date=new Date(Date.now())):Observable<CommitHistoryData[]> {
    if (!from) {
      from = new Date(until);
      from.setHours(from.getHours()-(10*7*24));
    }
    const queryString = this.getQueryString(from.toISOString(), until.toISOString());
    return this.dataService.getData(queryString).pipe(map(data=> { return <CommitHistoryData[]> data }))
  };

  private getQueryString(from:string, until:string):string {
  return `
    ${prefixes}
    SELECT ?date (COUNT(DISTINCT ?add) as ?additions) (COUNT(DISTINCT ?rem) as ?removals) ?total
    WHERE { 
      {
        SELECT ((COUNT(DISTINCT ?a) - COUNT(DISTINCT ?r)) as ?total)
        WHERE {
          ?c prov:qualifiedUsage ?u .
          OPTIONAL { ?u cs:addition ?a	FILTER NOT EXISTS { ?a rdf:comment "hidden" } . }
          OPTIONAL { ?u cs:removal ?r FILTER NOT EXISTS { ?r rdf:comment "hidden" }  . }          
        }
      }
      ?commit prov:qualifiedUsage ?usage ;
        prov:endedAtTime ?d .
      OPTIONAL { ?usage cs:addition ?add	FILTER NOT EXISTS { ?add rdf:comment "hidden" } . }
      OPTIONAL { ?usage cs:removal ?rem FILTER NOT EXISTS { ?rem rdf:comment "hidden" }  . }
      BIND (CONCAT(STR(YEAR(?d)), 
        "-", 
        STR(MONTH(?d)), 
        "-", 
        STR(DAY(?d))) as ?date)
      filter (?d >= "${from}"^^xsd:dateTime && ?d <= "${until}"^^xsd:dateTime)
    }
    group by ?date ?total
    order by ?date`;
  }
}

export interface CommitHistoryData {
  date:JSONResponsePartDate,
  additions:JSONResponsePartNumber,
  removals:JSONResponsePartNumber,
  total:JSONResponsePartNumber
}