import { Injectable, ChangeDetectorRef } from '@angular/core';
import { CommitMetaDataService, CommitMetaData } from './queries/commit-meta-data.service';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { CommitDetails, CommitDetailsService } from './queries/commit-details.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { ProvTreeItemsService } from './prov-tree-items.service';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { TreeStyleService, TreeItemStyle } from 'src/app/core/services/tree-style.service';
import { map, flatMap } from 'rxjs/operators';
import { ProgressService, Task } from 'src/app/services/progress.service';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceService {

    constructor(
        public configuration:ConfigurationService,
        private commitMetaDataService:CommitMetaDataService,
        private provTreeItemsService: ProvTreeItemsService,
		private commitDetailsService:CommitDetailsService,
		private progressService:ProgressService,
		private treeDataService:TreeDataService,
		private treeStyleService:TreeStyleService,
    ) {         

		this.treeDataService.addTreeItemConceptInformation(this.treeData$);
		this.treeStyleService.addTreeItemStyles(this.treeData$.pipe(
			map(td => {
				let treeItemStyles:TreeItemStyle[] = td.map(ci => {
					let style = this.treeStyleService.getEmptyStyle(ci.concept);
					style.icons.push({
						style,
						type: "chip",
						"background-color": "#FFFBD5",
						"border-color": "#DDD",
						color: "#333",
						id: "propertychange",
						description: "This element has changed properties.",
						text: "modified",
						"bubble-up": {
							style,
						  	type: "dot",
						  	"background-color": "#FFFBD5",
							"border-color": "#DDD",
						  	id: "propertychange_bubble",
							color: "#333",
						  	description: "There are COUNTER sub-elements with changed properties."
						}
					});
					return style;
				})
				return treeItemStyles;
			})
		));
		this.selectedCommits$.subscribe(commitidsarr => {
			if (commitidsarr) commitidsarr.forEach(cia => this.loadCommitIntoTree(cia));
		});
		this.selectedWholeTimespan$.subscribe(pf => {
			if (pf) this.loadAllIntoTree(pf);
		})
		this.selectedDateValue$.subscribe(date => {
			if (date) this.loadDateIntoTree(date);
		})
    }
	public displayOptions$:BehaviorSubject<{}> = new BehaviorSubject<{}>(this.configuration.initialCheckedPredicates);
	private combinedCommitDetails$:ReplaySubject<CommitDetails[]>=new ReplaySubject<CommitDetails[]>(1);
	private treeData$:ReplaySubject<ConceptInformation[]>=new ReplaySubject<ConceptInformation[]>(1);
	public selectedCommits$ = new ReplaySubject<string[]>(1);
	public selectedDateValue$ = new ReplaySubject<string>(1);
	public selectedWholeTimespan$ = new ReplaySubject<string>(1);

    public getMetaData(from:Date, until?:Date):Observable<CommitMetaData[]>{
        return this.commitMetaDataService.get(from, until);
    }

    public getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
        let date = new Date(day);
        return this.commitMetaDataService.get(new Date(date.setHours(0,0,0,0)), new Date(date.setHours(24,0,0,0)));
    }

    public getAllMetaDataSince$(date:Date):Observable<CommitMetaData[]>{
        return this.commitMetaDataService.get(new Date(date), new Date(Date.now()));
    }

	private getProvenanceOverviewTask:Task;
	private commitsToLoad:number=0;
	private loadedCommits:number=0;
    public getProvenance(from:Date) {
		console.log("Trigger");
        let commitMetaDataByDay=[];
		this.commitsToLoad=0;
		this.loadedCommits=0;

		let index = 0;
		for (let date = new Date(Date.now()); date >= from; date.setHours(date.getHours() - 24)){
			this.commitsToLoad++;
			let day = new Date(date);
			commitMetaDataByDay[index] =[day,[]];
			let myindex = index;
			this.getCommitMetaDataByDay$(day).subscribe(cmd => {
				this.commitsToLoad+=cmd.length;
				this.loadedCommits++;
				commitMetaDataByDay[myindex] =[day,cmd];
			});
			index++;
		}
		this.getProvenanceOverviewTask = this.progressService.addModuleTask("Get Provenance Overview",this.commitsToLoad);
        return commitMetaDataByDay;
	}
	public onCommitFinishedLoading(commitid:string){
		this.loadedCommits++;
		this.getProvenanceOverviewTask.update(this.loadedCommits,this.commitsToLoad);
		if (this.loadedCommits >= this.commitsToLoad) this.getProvenanceOverviewTask.finish();
	}

    public setProvenanceDate(from:Date){    
		this.provTreeItemsService.setProvTreeItemAttributes(from);
    }

	public getConceptTableInformation(commitDetails:CommitDetails[], displayOptions$:BehaviorSubject<{}>):Observable<ConceptInformation[]>{
		let cis = new ReplaySubject<ConceptInformation[]>(1);
		displayOptions$.subscribe(displayOptions => {
            let result:ConceptInformation[] = [];
            let subject = "";
            let predicate = "";
			let lang = "";
            let date:Date;
            //afterwards, results contains one entry for each affected concept. unique predicates like labels will appear only once
			commitDetails.forEach(cd => {
                if (!displayOptions[cd.predicate.value]) return;

                let overwritePreviousAddition = false;
                if (subject == cd.subject.value
					&& predicate == cd.predicate.value
					&& date== cd.date.value
                    && (!cd.object["xml:lang"] || lang == cd.object["xml:lang"])
                    && this.configuration.uniquePredicates.includes(predicate)) 
                {
                    if (!cd.addition.value) return; //removal, das nach dem ersten removal kam
                    else overwritePreviousAddition = true; //addition, die die vorherige addition überschreibt
                }
                subject = cd.subject.value;
                predicate = cd.predicate.value;
				lang = cd.object["xml:lang"] || "";
				date = cd.date.value;
				let author = cd.author.value;
				author=this.configuration.cutPrefix(author);

				cd = this.configuration.getHumanReadableCommitDetailData(cd);
				let cia = result.filter(r => r.concept == cd.subject.value);
				let ci:ConceptInformation = cia[0] || { 
					concept: cd.subject.value,
					headings: ["Meta","Attribute","Old Value","New Value"],
					cellWidthPercentages: [20,20,30,30],
					cellMaxWidth: [130,130,0,0],
					sourceId: "Provenance",
					cells:[]
				};
				let objectlabel = cd.ol?cd.ol.value:cd.object?cd.object.value:"";
				if (overwritePreviousAddition)console.log("joooo");
                if (overwritePreviousAddition){
                    ci.cells[ci.cells.length -1][3]=objectlabel;
                }
                else ci.cells.push([
                    date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'}) + " " + author,
					cd.predicate?cd.predicate.value+(lang?" ("+lang.toUpperCase()+")":""):"",
					!cd.addition.value?objectlabel:"",
					cd.addition.value?objectlabel:""
				]);
				if (cia.length == 0 && ci.cells.length>0) result.push(ci);
            });
            //merge lines
            result.forEach(ci => {
                for (let i = 0; i < ci.cells.length; i++){
                    let mergeParts = ci.cells.filter(c => c[0]==ci.cells[i][0] && c[1]==ci.cells[i][1]);
                    if (mergeParts.length == 2) {
                        if (mergeParts[0][2] != "" && mergeParts[1][3] != "") mergeParts[0][3] = mergeParts[1][3];
                        else mergeParts[0][2] = mergeParts[1][2];
                        ci.cells.splice(ci.cells.indexOf(mergeParts[1]),1);
					}
					if (mergeParts[0][2]==mergeParts[0][3])	ci.cells.splice(ci.cells.indexOf(mergeParts[0]),1)
                }
            })
			cis.next(result.filter(ci => ci.cells.length>0));
		});
		return cis;
    }
    




    
    public setDisplayOptions(displayOptions$){
        this.displayOptions$ = displayOptions$
    }

	public clearTree(){
		this.combinedCommitDetails$.next([]);
		this.updateTreeData();
    }
	
	private loadingCommits:string[]=[];
	public loadCommitIntoTree(commitid){  
		this.loadingCommits.push(commitid);
		this.commitDetailsService.getByCommitId(commitid).subscribe(newcds => {
			let currentcds:CommitDetails[] = [];
			this.combinedCommitDetails$.subscribe(cds => currentcds = cds).unsubscribe();
			this.combinedCommitDetails$.next(currentcds.concat(newcds));
			this.loadingCommits.splice(this.loadingCommits.indexOf(commitid),1);
			if (this.loadingCommits.length==0) this.updateTreeData();
		});
	}

	public loadDateIntoTree(date:string){
		this.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}

	public loadAllIntoTree(date:string){
		this.getAllMetaDataSince$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}

	public updateTreeData(){
		this.combinedCommitDetails$.pipe(
			flatMap(cds => this.getConceptTableInformation(cds, this.displayOptions$))
		).subscribe(data => this.treeData$.next(data)).unsubscribe();

	}
}
