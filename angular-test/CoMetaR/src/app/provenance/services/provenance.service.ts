import { Injectable } from '@angular/core';
import { CommitMetaDataService, CommitMetaData } from './queries/commit-meta-data.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceService {

  constructor(
    private commitMetaDataService:CommitMetaDataService
  ) { }

  public getMetaData(from:Date, until?:Date):Observable<CommitMetaData[]>{
    return this.commitMetaDataService.get(from, until);
  }

  public getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
    let date = new Date(day);
    return this.commitMetaDataService.get(new Date(date.setHours(0,0,0,0)), new Date(date.setHours(24,0,0,0)));
  }
}
