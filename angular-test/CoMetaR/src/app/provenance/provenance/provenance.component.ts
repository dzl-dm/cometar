import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ProvenanceService } from '../services/provenance.service';
import { Observable, Subject, ReplaySubject, BehaviorSubject, combineLatest } from 'rxjs';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map, flatMap } from 'rxjs/operators';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { CommitDetailsService, CommitDetails } from '../services/queries/commit-details.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { MatSliderChange } from '@angular/material';
import { ProvTreeItemsService } from '../services/prov-tree-items.service';

@Component({
	selector: 'app-provenance',
	templateUrl: './provenance.component.html',
	styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
	public fromDate:Date;
	public commitMetaDataByDay=[];
	public demometadata = {
		author:{value:'Author'},
		commitid:{value:'Commit-ID'},
		message:{value:'Commit Message'}
	}
	public categories = {};
	public selectedCommits$ = new ReplaySubject<string[]>(1);
	public selectedDateValue$ = new ReplaySubject<number>(1);
	public selectedWholeTimespan$ = new ReplaySubject<boolean>(1);
	private combinedCommitDetails$:ReplaySubject<CommitDetails[]>=new ReplaySubject<CommitDetails[]>(1);
	private treeData$:ReplaySubject<ConceptInformation[]>=new ReplaySubject<ConceptInformation[]>(1);
	constructor(
		private provenanceService:ProvenanceService,
		public configuration:ConfigurationService,
		private commitDetailsService:CommitDetailsService,
		private router:Router,
		private urlService:UrlService,
		private treeDataService:TreeDataService,
		private route:ActivatedRoute,
		private cd: ChangeDetectorRef
	) { 
	}

	ngOnInit() {
		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => {
			this.fromDate = date && new Date(date);
			if (!this.fromDate) {
				this.fromDate = new Date(Date.now());
				this.fromDate.setHours(this.fromDate.getHours()-(7*24));
				this.navigateToFromDate();
			}
		}).unsubscribe();
		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => {
			this.fromDate = date && new Date(date) || new Date(Date.now());
			let datediff = Date.now().valueOf()-this.fromDate.valueOf();
			this.historyFromDays = Math.floor(datediff/1000/60/60/24);
			this.commitMetaDataByDay = this.provenanceService.getProvenance(this.fromDate);
		});
		this.route.queryParamMap.pipe(
			map(data => [data.get('commit'),data.get('date'),data.get('wholetimespan'),data.get('provenancefrom')])
		).subscribe(([commitids,date,wholetimespan,provenancefrom]) => {
			setTimeout(()=>{
				this.clearTree();
				let commitidsarr = commitids && commitids.split(",").map(c => this.urlService.extendRdfPrefix(c)) || [];
				this.selectedCommits$.next(commitidsarr);
				if (commitidsarr.length > 0) commitidsarr.forEach(cia => this.loadCommitIntoTree(cia));
				this.selectedDateValue$.next(new Date(date).valueOf());
				this.selectedWholeTimespan$.next(wholetimespan == "true");
				if (wholetimespan == "true") this.loadAllIntoTree(provenancefrom);
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
			flatMap(cds => this.provenanceService.getConceptTableInformation(cds, this.displayOptions$))
		).subscribe(this.treeData$);
	}

	public getDemocommitdata(n1:number,n2:number,n3:number){
		let democommitdata = [];
		for (let i = 0; i < n1; i++){
			democommitdata.push({predicate: { value: "http://www.w3.org/2004/02/skos/core#prefLabel"},deprecatedsubject: { value: false }});
		}
		for (let i = 0; i < n3; i++){
			democommitdata.push({predicate: { value: "http://data.dzl.de/ont/dwh#unit"},deprecatedsubject: { value: false }});
		}
		for (let i = 0; i < n2; i++){
			democommitdata.push({predicate: { value: "http://data.dzl.de/ont/dwh#status"},deprecatedsubject: { value: false }});
		}
		return democommitdata;
	}

	private getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
		return this.provenanceService.getCommitMetaDataByDay$(day);
	}

	public onSelect(commitid:string){
		this.route.queryParamMap.pipe(
			map(data => data.get('commit'))
		).subscribe(commitids => {
			let commitidsarr = commitids && commitids.split(",").filter(c => c != undefined && c != "").map(c => this.urlService.extendRdfPrefix(c)) || [];
			if (!commitidsarr.includes(commitid)) commitidsarr = commitidsarr.concat(commitid);
			else commitidsarr.splice(commitidsarr.indexOf(commitid),1);
			commitidsarr = commitidsarr.map(c => this.urlService.shortenRdfPrefix(c));
			this.router.navigate(["provenance"],{ queryParams: {date: null, commit: commitidsarr.join(","), wholetimespan: null}, queryParamsHandling: "merge" });
		}).unsubscribe();
	}

	public isSelectedCommit(commitid:string){
		let result = false;
		this.selectedCommits$.subscribe(data => result = data.includes(commitid));
		return result;
	}

	public onDaySelect(date:Date){
		this.router.navigate(["provenance"],{ queryParams: {commit: null, date: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate(), wholetimespan: null}, queryParamsHandling: "merge" });
	}

	public onAllSelect(){
		this.router.navigate(["provenance"],{ queryParams: {commit: null, date: null, wholetimespan: "true"}, queryParamsHandling: "merge" });
	}

	public isSelectedDate(date:Date):Observable<boolean>{
		return this.selectedDateValue$.pipe(
			map(selectedDate => {
				let compareDateValue = new Date(date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()).valueOf();
				return compareDateValue == selectedDate.valueOf()
			})
		);
	}

	public isAllSelected():Observable<boolean>{
		return this.selectedWholeTimespan$;
	}

	private loadCommitIntoTree(commitid){  
		this.commitDetailsService.getByCommitId(commitid).subscribe(newcds => {
			let currentcds:CommitDetails[] = [];
			this.combinedCommitDetails$.subscribe(cds => currentcds = cds).unsubscribe();
			this.combinedCommitDetails$.next(currentcds.concat(newcds));
		});
	}


	private clearTree(){
		this.combinedCommitDetails$.next([]);
	}

	private loadDateIntoTree(date:string){
		this.provenanceService.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}

	private loadAllIntoTree(date:string){
		this.provenanceService.getAllMetaDataSince$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}

	public displayOptionToggle(option:string){
		this.displayOptions[option] = !this.displayOptions[option];
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


	
	public historyFromDays:number;
	public performHistoryChange(event:MatSliderChange){
		this.navigateToFromDate();
	}
	private navigateToFromDate(){
		this.router.navigate([],{queryParams: {provenancefrom: this.fromDate.getFullYear() +"-"+ (this.fromDate.getMonth()+1)+"-"+this.fromDate.getDate()}, queryParamsHandling: "merge" });
	}

	public changeHistoryFromLabel(event:MatSliderChange){
		let date = new Date(Date.now());
		date.setHours(date.getHours() - 24*event.value);
		this.fromDate = date;
	}
	public formatLabel(value:number){
		let date = new Date(Date.now());
		date.setHours(date.getHours() - 24*value);
		return date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'});
	}
}