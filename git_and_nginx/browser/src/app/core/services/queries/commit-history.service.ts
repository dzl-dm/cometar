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
      from.setFullYear(from.getFullYear()-1);
    }
    const queryString = this.getQueryString(from, until);
    return this.dataService.getData(queryString, "ontology changes from "+from.toISOString()+" until "+until.toISOString()).pipe(map(data=> { return <CommitHistoryData[]> data }))
  };

  public getQueryString(from:Date, until:Date):string {
  return `#ontology changes since...
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
      {
        SELECT ?usage ?d
        WHERE {
          {
          SELECT DISTINCT ?minlastdate
          WHERE {
            ?c prov:qualifiedUsage ?u ;
              prov:endedAtTime ?minlastdate .
          }
          order by desc(?minlastdate)
          limit 1
          offset 3
          }
          ?commit prov:qualifiedUsage ?usage ;
          prov:endedAtTime ?d .
          filter ((?d >= "${from.toISOString()}"^^xsd:dateTime || ?d >= ?minlastdate) && ?d <= "${until.toISOString()}"^^xsd:dateTime)
        }
      }
		  OPTIONAL { ?usage cs:addition ?add FILTER NOT EXISTS { ?add rdf:comment "hidden" } . }
		  OPTIONAL { ?usage cs:removal ?rem FILTER NOT EXISTS { ?rem rdf:comment "hidden" }  . }
      BIND (CONCAT(STR(YEAR(?d)), 
        "-", 
        STR(MONTH(?d)), 
        "-", 
        STR(DAY(?d))) as ?date)
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