import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService, JSONResponsePartNumber, JSONResponsePartString, JSONResponsePartDate, prefixes } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommitMetaDataService {

  constructor(
    private dataService:DataService
  ) { }

  public get(from:Date, until:Date=new Date(Date.now())):Observable<CommitMetaData[]> {
    const queryString = this.getQueryString(from.toISOString(), until.toISOString());
    return this.dataService.getData(queryString).pipe(map(data=> { return <CommitMetaData[]> data }))
  };

  private getQueryString(from:string, until:string):string {
  return `
    ${prefixes}
    SELECT ?commitid ?author ?message ?enddate
    WHERE
    {
      ?commitid a prov:Activity ;
        prov:wasAssociatedWith ?author ;
        prov:endedAtTime ?enddate ;
        prov:label ?message ;
      .	
      filter (?enddate >= "${from}"^^xsd:dateTime && ?enddate <= "${until}"^^xsd:dateTime)
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
