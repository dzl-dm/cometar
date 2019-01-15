import { Component, OnInit } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, combineLatest } from 'rxjs';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map } from 'rxjs/operators';
import { ConceptInformation, TreeDataService } from 'src/app/core/services/tree-data.service';
import { CommitDetailsService, CommitDetails } from '../services/queries/commit-details.service';

@Component({
  selector: 'app-provenance',
  templateUrl: './provenance.component.html',
  styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
  private fromDate:Date = new Date("2018-10-13");
  public commitMetaDataByDay=[];
  public selectedCommit$:ReplaySubject<string> = new ReplaySubject<string>(1);
  public selectedDate$:ReplaySubject<string> = new ReplaySubject<string>(1);
  public categories = {};
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
      map(data => this.urlService.extendRdfPrefix(data.get('commit')))
    ).subscribe(this.selectedCommit$);
    this.selectedCommit$.subscribe(commitid => {
      if (commitid != "") setTimeout(()=>{
        this.clearTree();
        this.loadCommitIntoTree(commitid)
      },0);
    });
    this.route.queryParamMap.pipe(
      map(data => this.urlService.extendRdfPrefix(data.get('date')))
    ).subscribe(this.selectedDate$);
    this.selectedDate$.subscribe(date => {
      if (date != "") setTimeout(()=>{
        this.clearTree();
        this.loadDateIntoTree(date)
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

  private getConceptInformation(commitDetails:CommitDetails[]):Observable<ConceptInformation[]>{
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
  private loadCommitIntoTree(commitid){   
    let result:ConceptInformation[];
    this.treeData$.subscribe(data => result = data).unsubscribe();
    this.commitDetailsService.get(commitid).subscribe(cds => {
      this.getConceptInformation(cds).subscribe(this.treeData$);
    });
  }
  private clearTree(){
    this.treeData$.next([]);
  }

  private loadDateIntoTree(date:string){
    this.provenanceService.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
      this.loadCommitIntoTree(cmd.commitid.value);
    }));
  }

  private loadDataIntoTree(cds:CommitDetails[]){
    
  }

  public displayOptionToggle(predicate:string){
    this.displayOptions[predicate] = !this.displayOptions[predicate];
    this.displayOptions$.next(this.displayOptions);
  }

  private displayOptions = this.configuration.initialCheckedPredicates;
  public displayOptions$:BehaviorSubject<{}>;
}