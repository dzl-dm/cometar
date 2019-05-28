import { Injectable, ChangeDetectorRef } from '@angular/core';
import { CommitMetaDataService, CommitMetaData } from './queries/commit-meta-data.service';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { CommitDetails } from './queries/commit-details.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { ProvTreeItemsService } from './prov-tree-items.service';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceService {

    constructor(
        public configuration:ConfigurationService,
        private commitMetaDataService:CommitMetaDataService,
        private provTreeItemsService: ProvTreeItemsService,
    ) { }

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

    public getProvenance(from:Date) {
        let commitMetaDataByDay=[];

		let index = 0;
		for (let date = new Date(Date.now()); date >= from; date.setHours(date.getHours() - 24)){
			let day = new Date(date);
			commitMetaDataByDay[index] =[day,[]];
			let myindex = index;
			this.getCommitMetaDataByDay$(day).subscribe(cmd => {
				commitMetaDataByDay[myindex] =[day,cmd];
			});
			index++;
        }
        return commitMetaDataByDay;
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
					&& date == cd.date.value
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

				cd = this.configuration.getHumanReadableCommitDetailData(cd);
				let cia = result.filter(r => r.concept == cd.subject.value);
				let ci:ConceptInformation = cia[0] || { 
					concept: cd.subject.value,
					headings: ["Date","Attribute","Old Value","New Value"],
					cellWidthPercentages: [20,20,30,30],
					sourceId: "Provenance",
					cells:[]
				};
                let objectlabel = cd.ol?cd.ol.value:cd.object?cd.object.value:"";
                if (overwritePreviousAddition){
                    ci.cells[ci.cells.length -1][2]=objectlabel;
                }
                else ci.cells.push([
                    date.toLocaleString(),//toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'}),
					cd.predicate?cd.predicate.value+(lang?" ("+lang.toUpperCase()+")":""):"",
					!cd.addition.value?objectlabel:"",
					cd.addition.value?objectlabel:""
                ]);
				if (cia.length == 0) result.push(ci);
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
                }
            })
			cis.next(result);
		});
		return cis;
	}
}
