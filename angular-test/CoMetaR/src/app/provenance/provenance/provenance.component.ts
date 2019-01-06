import { Component, OnInit } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable } from 'rxjs';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-provenance',
  templateUrl: './provenance.component.html',
  styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
  private fromDate:Date = new Date("2018-12-13");
  private days:Date[]=[];
  constructor(
    private provenanceService:ProvenanceService,
    private configuration:ConfigurationService
  ) { }

  ngOnInit() {
    for (let date = new Date(Date.now()); date >= this.fromDate; date.setHours(date.getHours() - 24)){
      this.days.push(new Date(date));
    }
  }
  private getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
    return this.provenanceService.getCommitMetaDataByDay$(day);
  }
}
