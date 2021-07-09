import { Injectable } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GetDerivedConceptService {

  constructor(
    private dataService:DataService
  ) { }

  public get(iri:string):Observable<string[]> {
    const queryString = this.getQueryString(iri);
    return this.dataService.getData(queryString, "derived concept of "+iri).pipe(map(data=> { return <string[]> data || [] }))
  };

  private getQueryString(iri:string):string {
  return `#derived concept
    ${this.dataService.prefixes}
SELECT DISTINCT ?derived_concept
WHERE { 
	?derived_concept prov:wasDerivedFrom+ <${iri}> .
  FILTER NOT EXISTS { ?b prov:wasDerivedFrom ?derived_concept . }
  FILTER NOT EXISTS { <${iri}> skos:prefLabel ?label } #it may be that the "old" concept exists "in a new way"
}`;
  }
}
