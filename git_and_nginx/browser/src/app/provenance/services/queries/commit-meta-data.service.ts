import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService, JSONResponsePartNumber, JSONResponsePartString, JSONResponsePartDate, prefixes } from 'src/app/services/data.service';
import { map, first } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommitMetaDataService {

  constructor(
    private dataService:DataService
  ) { }

  public get(from:Date, until:Date=new Date(Date.now())):Observable<CommitMetaData[]> {
    const queryString = this.getQueryString(from, until);
    return this.dataService.getData(queryString, "commit metadata from "+from.toISOString()+" until "+until.toISOString())
      .pipe(map(data=> { return <CommitMetaData[]> data }))
  };

  public getQueryString(from:Date, until:Date):string {
  return `#commit metadata
    ${prefixes}
    SELECT ?commitid ?author ?message ?enddate
    WHERE
    {
      ?commitid a prov:Activity ;
        prov:wasAssociatedWith ?author ;
        prov:endedAtTime ?enddate ;
        prov:label ?message ;
      .	
      filter (?enddate >= "${from.toISOString()}"^^xsd:dateTime && ?enddate <= "${until.toISOString()}"^^xsd:dateTime)
    }
    order by DESC(?enddate )`;
  }
}

export interface CommitMetaData {
  commitid:JSONResponsePartString,
  author:JSONResponsePartString,
  message:JSONResponsePartString,
  enddate:JSONResponsePartDate
}
