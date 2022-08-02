import { Injectable, ChangeDetectorRef } from '@angular/core';
import { CommitMetaDataService, CommitMetaData } from './queries/commit-meta-data.service';
import { Observable, ReplaySubject, BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { CommitDetails, CommitDetailsService } from './queries/commit-details.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { ProvTreeItemsService } from './prov-tree-items.service';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { TreeStyleService, TreeItemStyle } from 'src/app/core/services/tree-style.service';
import { map, flatMap, filter } from 'rxjs/operators';
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
						"border-color": "#AAA",
						color: "#333",
						id: "propertychange",
						description: "This element has changed properties.",
						text: "modified",
						"bubble-up": {
							style,
						  	type: "dot",
						  	"background-color": "#FFFBD5",
							"border-color": "#AAA",
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
			if (commitidsarr) this.loadCommitsIntoTree(commitidsarr);
		});
		this.selectedWholeTimespan$.subscribe(pf => {
			if (pf) this.loadAllIntoTree(pf);
		});
		this.selectedDateValue$.subscribe(date => {
			if (date) this.loadDateIntoTree(date);
		});
		combineLatest(this.getOverViewSubtaskRunning$,this.getProvTreeItemsSubtaskRunning$,this.commitsLoadingIntoTree$).subscribe(data=>{
			let add = data[1]?1:0;
			let message = "";
			if (data[0]) message += "Metadata loading. ("+this.commitsLeft+") ";
			if (data[1]) message += "Tree provenance data loading. ";
			if (data[2]) message += "Tree commit detail data loading. ";
			
			if (data.includes(true) && this.provenanceTask && this.provenanceTask.status=="running"){
				/*console.log(this.loadedElements);
				console.log(this.loadedIntoTreeCommits);
				console.log(this.elementsToLoad);
				console.log(this.commitsToLoadIntoTree);*/
				this.provenanceTask.update(this.loadedElements+this.loadedIntoTreeCommits,this.elementsToLoad+this.commitsToLoadIntoTree,message);
			}
			else if (!data.includes(true) && this.provenanceTask && this.provenanceTask.status!="finished"){
				this.provenanceTask.finish();
			}
			else if (data.includes(true)) this.provenanceTask = this.progressService.addModuleTask("Provenance",this.elementsToLoad+this.commitsToLoadIntoTree);

		});
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

	private provenanceTask:Task;
	private getOverViewSubtaskPercentage$=new BehaviorSubject<number>(0);
	private getOverViewSubtaskRunning$:Observable<boolean>=this.getOverViewSubtaskPercentage$.pipe(map(p => p>=100))//new BehaviorSubject<boolean>(false);
	private getProvTreeItemsSubtaskRunning$ = this.provTreeItemsService.busy$;
	private elementsToLoad:number=0;
	private loadedElements:number=0;
	private commitsLeft:string[]=[];
    public getProvenance(from:Date) {
		let commitMetaDataByDay=[];
		this.getOverViewSubtaskPercentage$.next(0);
		this.elementsToLoad=0;
		this.loadedElements=0;
		this.commitsLeft=[];

		let index = 0;
		for (let date = new Date(Date.now()); date >= from; date.setHours(date.getHours() - 24)){
			this.elementsToLoad++;
			let day = new Date(date);
			commitMetaDataByDay[index] =[day,[]];
			let myindex = index;
			this.getCommitMetaDataByDay$(day).subscribe(cmd => {
				this.elementsToLoad+=cmd.length;
				//if (cmd.length > 0) this.getOverViewSubtaskRunning$.next(true);
				cmd.map(c => c.commitid.value).forEach(c=>{
					if (this.commitsLeft.indexOf(c)==-1) this.commitsLeft.push(c)
				});
				this.loadedElements++;
				commitMetaDataByDay[myindex] =[day,cmd];
			});
			index++;
		}
        return commitMetaDataByDay;
	}
	public onCommitFinishedLoading(commitid:string){
		this.loadedElements++;
		this.commitsLeft.splice(this.commitsLeft.indexOf(commitid),1);
		//if (this.loadedElements >= this.elementsToLoad) this.getOverViewSubtaskRunning$.next(false);
		this.getOverViewSubtaskPercentage$.next(Math.round(this.loadedElements/this.elementsToLoad));
	}

    public setProvenanceDate(from:Date){    
		this.provTreeItemsService.setProvTreeItemAttributes(from);
    }

	public getConceptTableInformation(commitDetails:CommitDetails[]):Observable<ConceptInformation[]>{
		let cis = new ReplaySubject<ConceptInformation[]>(1);
		this.displayOptions$.subscribe(displayOptions => {
            let result:ConceptInformation[] = [];
            let subject = "";
            let predicate = "";
			let lang = "";
            let date:Date;
            //afterwards, results contains one entry for each affected concept. unique predicates like labels will appear only once
			commitDetails.forEach(cd => {
                if (this.configuration.lastChangesExcludedPredicates.includes(cd.predicate.value)) return;
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
				author=author;

				cd = this.configuration.getHumanReadableCommitDetailData(cd);
				let cia = result.filter(r => r.concept == cd.subject.value);
				let ci:ConceptInformation = cia[0] || { 
					concept: cd.subject.value,
					headings: ["Meta","Attribute","Old Value","New Value"],
					columnWidthPercentages: [20,20,30,30],
					columnMinWidth: [130,130,100,100],
					columnDisplayOptions: ["showAndShrink","showAndShrink","hideOrGrow","hideOrGrow"],
					sourceId: "Provenance",
					cells:[]
				};
				let objectlabel = /*cd.ol?cd.ol.value:*/cd.object?cd.object.value:"";
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
                for (let i = ci.cells.length-1; i >= 0 ; i--){
                    let mergeParts = ci.cells.filter(c => c[0]==ci.cells[i][0] && c[1]==ci.cells[i][1]);
                    if (mergeParts.length == 2) {
                        if (mergeParts[0][2] != "" && mergeParts[1][3] != "") mergeParts[0][3] = mergeParts[1][3];
                        else mergeParts[0][2] = mergeParts[1][2];
                        ci.cells.splice(ci.cells.indexOf(mergeParts[1]),1);
					}
					if (mergeParts[0][2]==mergeParts[0][3])	ci.cells.splice(ci.cells.indexOf(mergeParts[0]),1)
                }
			});
			cis.next(result.filter(ci => ci.cells.length>0));
		});
		return cis;
    }
    




    
    public setDisplayOptions(displayOptions$){
        this.displayOptions$ = displayOptions$;
		this.displayOptions$.subscribe(d => this.updateTreeData());
    }

	public clearTree(){
		this.combinedCommitDetails$.next([]);
		this.updateTreeData();
    }
	
	private loadingIntoTreeCommits:string[]=[];
	private commitsLoadingIntoTree$=new BehaviorSubject(false);
	private commitsToLoadIntoTree=0;
	private loadedIntoTreeCommits=0;
	private loadCommitIntoTree(commitid){  
		this.loadingIntoTreeCommits.push(commitid);
		this.commitsLoadingIntoTree$.next(true);
		this.commitDetailsService.getByCommitId(commitid).subscribe(newcds => {
			let currentcds:CommitDetails[] = [];
			this.combinedCommitDetails$.subscribe(cds => currentcds = cds).unsubscribe();
			this.combinedCommitDetails$.next(currentcds.concat(newcds));
			this.loadingIntoTreeCommits.splice(this.loadingIntoTreeCommits.indexOf(commitid),1);
			this.loadedIntoTreeCommits++;
			if (this.loadingIntoTreeCommits.length==0 && this.loadedIntoTreeCommits==this.commitsToLoadIntoTree) {
				this.commitsLoadingIntoTree$.next(false);
				this.updateTreeData();
			}
		});
	}

	private loadCommitsIntoTree(commitids:string[]){
		this.loadedIntoTreeCommits=0;
		this.commitsToLoadIntoTree=commitids.length;
		commitids.forEach(id => this.loadCommitIntoTree(id));
	}
	private loadDateIntoTree(date:string){
		this.loadedIntoTreeCommits=0;
		this.getCommitMetaDataByDay$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.commitsToLoadIntoTree=data.length;
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}
	private loadAllIntoTree(date:string){
		this.loadedIntoTreeCommits=0;
		this.getAllMetaDataSince$(new Date(date)).subscribe(data => data.forEach((cmd)=>{
			this.commitsToLoadIntoTree=data.length;
			this.loadCommitIntoTree(cmd.commitid.value);
		}));
	}

	private updateTimeout;
	private updateTreeData(){
		if (this.updateTimeout){
			clearTimeout(this.updateTimeout);
		}
		this.updateTimeout = setTimeout(() => {
			this.combinedCommitDetails$.pipe(
				flatMap(cds => this.getConceptTableInformation(cds.filter(cd => {
					return this.displayOptions$.getValue()[cd.predicate.value];
				})))
			).subscribe(data => this.treeData$.next(data)).unsubscribe();
		}, 200);
	}
}
