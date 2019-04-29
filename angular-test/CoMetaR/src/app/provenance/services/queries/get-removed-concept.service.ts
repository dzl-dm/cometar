import { Injectable } from '@angular/core';
import { DataService, prefixes } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetRemovedConceptService {

  constructor(
    private dataService:DataService
  ) { }

  public get(iri:string):Observable<Date> {
    const queryString = this.getQueryString(iri);
    return this.dataService.getData(queryString).pipe(map(data=> { return data.length > 0 && new Date(data[0]["date"].value) || null }))
  };

  private getQueryString(iri:string):string {
  return `
    ${prefixes}
SELECT DISTINCT ?date
WHERE { 
  ?commit prov:qualifiedUsage ?cs ;
    prov:endedAtTime ?date .		
  ?cs a cs:ChangeSet .
  ?cs cs:removal [
    a rdf:Statement;
    rdf:subject <${iri}>;
    rdf:predicate rdf:type
  ] .
  FILTER NOT EXISTS { <${iri}> rdf:type ?type }
}`;
  }
}
