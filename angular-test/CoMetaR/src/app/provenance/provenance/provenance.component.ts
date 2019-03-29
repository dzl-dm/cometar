import { Component, OnInit } from '@angular/core';
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

@Component({
	selector: 'app-provenance',
	templateUrl: './provenance.component.html',
	styleUrls: ['./provenance.component.css']
})
export class ProvenanceComponent implements OnInit {
	private fromDate:Date = new Date("2019-01-12");
	public commitMetaDataByDay=[];
	public categories = {};
	public selectedCommits$ = new ReplaySubject<string[]>(1);
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
			map(data => [data.get('commit'),data.get('date')])
		).subscribe(([commitids,date]) => {
			setTimeout(()=>{
				this.clearTree();
				let commitidsarr = commitids && commitids.split(",").map(c => this.urlService.extendRdfPrefix(c)) || [];
				this.selectedCommits$.next(commitidsarr);
				if (commitidsarr.length > 0) commitidsarr.forEach(cia => this.loadCommitIntoTree(cia));
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
			flatMap(cds => this.provenanceService.getConceptTableInformation(cds, this.displayOptions$))
		).subscribe(this.treeData$);
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
			this.router.navigate(["provenance"],{ queryParams: {date: null, commit: commitidsarr.join(",")}, queryParamsHandling: "merge" });
		}).unsubscribe();
	}

	public isSelectedCommit(commitid:string){
		let result = false;
		this.selectedCommits$.subscribe(data => result = data.includes(commitid));
		return result;
	}

	public onDaySelect(date:Date){
		this.router.navigate(["provenance"],{ queryParams: {commit: null, date: date.getFullYear()+"-"+(date.getMonth()+1)+"-"+date.getDate()}, queryParamsHandling: "merge" });
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
		this.commitDetailsService.getByCommitId(commitid).subscribe(newcds => {
			let currentcds:CommitDetails[] = [];
			this.combinedCommitDetails$.subscribe(cds => currentcds = cds).unsubscribe();
			this.combinedCommitDetails$.next(currentcds.concat(newcds));
		});
	}

	/**
	 * TODO: merge details
	 * 
	 
	private mergeCommitDetails(cds:CommitDetails[]):CommitDetails[]{
		let ups = this.configuration.uniquePredicates;    
		let subjects = cds.map(cd => cd.subject);
		subjects = subjects.filter((value, index) => subjects.indexOf(value) == index);
		subjects.forEach(s => {
			ups.forEach(up=>{
				let sps = cds.filter(cd => cd.subject == s && cd.predicate.value == up);
				let i = 0;
				while (i < sps.length){
					if (sps.filter((sp,index)=>
						index > i 
						&& sps[i].object["xml:lang"] == sp.object["xml:lang"]))
					{
						//sps[i] und sp (mit größerem Index) haben gleiches Subject, gleiches (unique) predicate, gleiche lang

					}
					i++;
				}
			});
		});
		return cds;
	}*/

	private clearTree(){
		this.combinedCommitDetails$.next([]);
	}

	private loadDateIntoTree(date:string){
		this.provenanceService.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
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

}