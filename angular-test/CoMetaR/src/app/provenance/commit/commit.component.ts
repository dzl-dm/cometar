import { Component, OnInit, Input, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { Observable, combineLatest } from 'rxjs';
import { CommitDetails, CommitDetailsService } from '../services/queries/commit-details.service';
import { CommitDetailsComponent } from '../commit-details/commit-details.component';
import { TreeDataService, ConceptInformation } from 'src/app/core/services/tree-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { filter, map, withLatestFrom, combineAll } from 'rxjs/operators';

@Component({
  selector: 'app-commit',
  templateUrl: './commit.component.html',
  styleUrls: ['./commit.component.css']
})
export class CommitComponent implements OnInit {
  @Input() commitMetaData:CommitMetaData;
  @Input() displayOptions$:Observable<{}>;
  @Output() onSelect: EventEmitter<string> = new EventEmitter();
  private commitDetails:CommitDetails[]=[];
  public categories={};
  public commitMetaDataHR:CommitMetaData;
  constructor(
    private commitDetailsService:CommitDetailsService,
    private configuration:ConfigurationService
  ) { }

  ngOnInit() {
    combineLatest(this.commitDetailsService.get(this.commitMetaData.commitid.value),this.displayOptions$).pipe(
      map(data => {
        let cds = data[0];
        let displayOptions = data[1];
        return cds.filter(cd => {
          return displayOptions[cd.predicate.value] == true
        })
      })
    ).subscribe(data => {
      this.commitDetails=data;
      this.categories={};
      this.commitDetails.forEach(cd => {
        let category = this.configuration.getCategory(cd);
        if (!category) return;
        if (this.categories[category]) this.categories[category]++;
        else this.categories[category] = 1;
      });
    });
    this.commitMetaDataHR=this.configuration.getHumanReadableCommitMetaData(this.commitMetaData);
  }
  onClick(){
    this.onSelect.emit(this.commitMetaData.commitid.value);
  }
}
