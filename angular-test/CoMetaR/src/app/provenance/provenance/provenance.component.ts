import { Component, OnInit } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable } from 'rxjs';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
  selector: 'app-provenance',
  templateUrl: './provenance.component.html',
  styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
  private fromDate:Date = new Date("2018-12-13");
  private commitMetaDataByDay=[];
  constructor(
    private provenanceService:ProvenanceService,
    private configuration:ConfigurationService
  ) { }

  ngOnInit() {
    let index = 0;
    for (let date = new Date(Date.now()); date >= this.fromDate; date.setHours(date.getHours() - 24)){
      let day = new Date(date);
      this.commitMetaDataByDay[index] =[day,[]];
      let myindex = index;
      this.provenanceService.getCommitMetaDataByDay$(day).subscribe(cmd => {
        this.commitMetaDataByDay[myindex] =[day,cmd];
      });
      index++;
    }
  }
  private getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
    return this.provenanceService.getCommitMetaDataByDay$(day);
  }
}
