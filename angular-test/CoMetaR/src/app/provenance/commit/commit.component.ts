import { Component, OnInit, Input, ElementRef, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { Observable, combineLatest, of, Subject } from 'rxjs';
import { CommitDetails, CommitDetailsService } from '../services/queries/commit-details.service';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { filter, map, withLatestFrom, combineAll, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-commit',
  templateUrl: './commit.component.html',
  styleUrls: ['./commit.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CommitComponent implements OnInit {
  @Input() commitMetaData:CommitMetaData = {author:{value:""},commitid:{value:""},enddate:{value: new Date(Date.now())},message:{value:""}};
  @Input() displayOptions$:Observable<{}>;
  @Input() displaycontainer;
  @Input() democommit?;
  @Input() label?;
  @Output() onSelect: EventEmitter<string> = new EventEmitter();
  @Output() finishedLoading: EventEmitter<string> = new EventEmitter();
  private commitDetails:CommitDetails[]=[];
  public categories={};
  public commitMetaDataHR:CommitMetaData;
  public mouseOvered=false;
  
  private unsubscribe: Subject<void> = new Subject();
  
  constructor(
    private commitDetailsService:CommitDetailsService,
    private configuration:ConfigurationService,
    private ele:ElementRef,
    private cd: ChangeDetectorRef
  ) { }

  ngOnInit() {    
    combineLatest(this.democommit && of(this.democommit) || this.commitDetailsService.getByCommitId(this.commitMetaData.commitid.value),this.displayOptions$).pipe(
      map(data => {
        this.finishedLoading.emit(this.commitMetaData.commitid.value);
        let cds = data[0];
        let displayOptions = data[1];
        return cds.filter(cd => {
          return displayOptions[cd.predicate.value] == true
        })
      })
    ).pipe(takeUntil(this.unsubscribe)).subscribe(data => {
      this.commitDetails=data;
      this.categories={};
      this.commitDetails.forEach(cd => {
        let category = this.configuration.getCategory(cd);
        if (!category) return;
        if (!this.categories[category]) this.categories[category] = { count: 0, deprecated: 0 };
        this.categories[category].count++;
        if (cd.deprecatedsubject.value) this.categories[category].deprecated++;
      });
      this.cd.markForCheck();
    });
    this.commitMetaDataHR=this.configuration.getHumanReadableCommitMetaData(this.commitMetaData);
  }
  onClick(){
    this.onSelect.emit(this.commitMetaData.commitid.value);
  }

  public getCommitDetailsVerticalDirection(){
    let nat = <HTMLElement>this.ele.nativeElement
    if (nat.offsetTop - this.displaycontainer.offsetTop + 200 > this.displaycontainer.offsetHeight + this.displaycontainer.scrollTop) return "up";
    else return "down"
  }

  public getCommitDetailsHorizontalDirection(){
    if (this.ele.nativeElement.offsetLeft + 400 > this.displaycontainer.offsetWidth + this.displaycontainer.scrollLeft) return "left";
    else return "right"
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
