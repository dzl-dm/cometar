import { Component, OnInit } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, combineLatest } from 'rxjs';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map, flatMap } from 'rxjs/operators';
import { ConceptInformation, TreeDataService } from 'src/app/core/services/tree-data.service';
import { CommitDetailsService, CommitDetails } from '../services/queries/commit-details.service';

@Component({
  selector: 'app-provenance',
  templateUrl: './provenance.component.html',
  styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
  private fromDate:Date = new Date("2018-12-13");
  public commitMetaDataByDay=[];
  public categories = {};
  public selectedCommit$ = new ReplaySubject<string>(1);
  public selectedDateValue$ = new ReplaySubject<number>(1);
  private combinedCommitDetails$:ReplaySubject<CommitDetails[]>=new ReplaySubject<CommitDetails[]>(1);
  private treeData$:ReplaySubject<ConceptInformation[]>=new ReplaySubject<ConceptInformation[]>(1);
  constructor(
    private provenanceService:ProvenanceService,
    public configuration:ConfigurationService,
    private commitDetailsService:CommitDetailsService,
    private router:Router,
    private urlService:UrlService,
    private treeDataService:TreeDataService,
    private route:ActivatedRoute
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

    this.route.queryParamMap.pipe(
      map(data => [this.urlService.extendRdfPrefix(data.get('commit')),this.urlService.extendRdfPrefix(data.get('date'))])
    ).subscribe(([commitid,date]) => {
      setTimeout(()=>{
        this.clearTree();
        this.selectedCommit$.next(commitid);
        if (commitid != "") this.loadCommitIntoTree(commitid);
        this.selectedDateValue$.next(new Date(date).valueOf());
        if (date != "") this.loadDateIntoTree(date);
      },0);
    });

    Object.keys(this.configuration.changeCategories).forEach(key => {
      if (this.configuration.changeCategories[key] == undefined) return;
      let value = this.configuration.changeCategories[key];
      this.categories[value]=this.categories[value] || [];
      this.categories[value].push(key)
    });
    this.displayOptions$=new BehaviorSubject<{}>(this.displayOptions);

    this.treeDataService.addConceptInformation(this.treeData$);

    this.combinedCommitDetails$.pipe(
      flatMap(cds => this.getConceptTableInformation(cds))
    ).subscribe(this.treeData$);
  }

  private getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
    return this.provenanceService.getCommitMetaDataByDay$(day);
  }

  public onSelect(commitid:string){
    this.router.navigate(["provenance"],{ queryParams: {date: null, commit: this.urlService.shortenRdfPrefix(commitid)}, queryParamsHandling: "merge" });
  }

  public onDaySelect(date:Date){
    this.router.navigate(["provenance"],{ queryParams: {commit: null, date: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()}, queryParamsHandling: "merge" });
  }

  private getConceptTableInformation(commitDetails:CommitDetails[]):Observable<ConceptInformation[]>{
    let cis = new ReplaySubject<ConceptInformation[]>(1);
    this.displayOptions$.subscribe(displayOptions => {
      let result:ConceptInformation[] = [];
      commitDetails.forEach(cd => {
        if (!displayOptions[cd.predicate.value]) return;
        cd = this.configuration.getHumanReadableCommitDetailData(cd);
        let cia = result.filter(r => r.concept == cd.subject.value);
        let ci:ConceptInformation = cia[0] || { 
          concept: cd.subject.value,
          headings: ["Attribute","Old Value","New Value"],
          sourceId: "Provenance",
          cells:[]
        };
        ci.cells.push([
          cd.predicate?cd.predicate.value:"",
          cd.ool?cd.ool.value:cd.oldobject?cd.oldobject.value:"",
          cd.nol?cd.nol.value:cd.newobject?cd.newobject.value:""
        ]);
        if (cia.length == 0) result.push(ci);
      });
      cis.next(result);
    });
    return cis;
  }

  public isSelectedDate(date:Date):Observable<boolean>{
    return this.selectedDateValue$.pipe(
      map(selectedDate => {
        let compareDateValue = new Date(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()).valueOf();
        return compareDateValue == selectedDate.valueOf()
      })
    );
  }

  private loadCommitIntoTree(commitid){  
    this.commitDetailsService.get(commitid).subscribe(newcds => {
      let currentcds:CommitDetails[] = [];
      this.combinedCommitDetails$.subscribe(cds => currentcds = cds).unsubscribe();
      this.combinedCommitDetails$.next(this.mergeCommitDetails(currentcds, newcds));
    });
    /*this.commitDetailsService.get(commitid).subscribe(cds => {
      this.getConceptTableInformation(cds).subscribe(cti => {
        let result:ConceptInformation[];
        this.treeData$.subscribe(data => result = data).unsubscribe();
        this.treeData$.next(cti.concat(result));
      });
    });*/
  }

  /**
   * TODO: merge details
   * 
   */
  private mergeCommitDetails(cds1:CommitDetails[], cds2:CommitDetails[]):CommitDetails[]{
    cds2.forEach(cd => {
      cds1.push(cd);
    });
    return cds1;
  }

  private clearTree(){
    this.treeData$.next([]);
  }

  private loadDateIntoTree(date:string){
    this.provenanceService.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
      this.loadCommitIntoTree(cmd.commitid.value);
    }));
  }

  public displayOptionToggle(predicate:string){
    this.displayOptions[predicate] = !this.displayOptions[predicate];
    this.displayOptions$.next(this.displayOptions);
  }

  public isOptionsHeadingChecked(category:string){
    let result = true;
    this.categories[category].forEach(predicate => {
      if (this.displayOptions[predicate] != true) result = false;
    });
    return result;
  }

  public displayOptionsHeadingToggle(category:string){
    let checked = this.isOptionsHeadingChecked(category);
    this.categories[category].forEach(predicate => {
      this.displayOptions[predicate] = !checked
    })
    this.displayOptions$.next(this.displayOptions);
  }

  private displayOptions = this.configuration.initialCheckedPredicates;
  public displayOptions$:BehaviorSubject<{}>;
}