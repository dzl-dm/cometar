import { Injectable } from '@angular/core';
import { CommitMetaDataService, CommitMetaData } from './queries/commit-meta-data.service';
import { Observable, ReplaySubject, BehaviorSubject } from 'rxjs';
import { CommitDetails } from './queries/commit-details.service';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceService {

    constructor(
        public configuration:ConfigurationService,
        private commitMetaDataService:CommitMetaDataService
    ) { }

    public getMetaData(from:Date, until?:Date):Observable<CommitMetaData[]>{
        return this.commitMetaDataService.get(from, until);
    }

    public getCommitMetaDataByDay$(day:Date):Observable<CommitMetaData[]>{
        let date = new Date(day);
        return this.commitMetaDataService.get(new Date(date.setHours(0,0,0,0)), new Date(date.setHours(24,0,0,0)));
    }

	public getConceptTableInformation(commitDetails:CommitDetails[], displayOptions$:BehaviorSubject<{}>):Observable<ConceptInformation[]>{
		let cis = new ReplaySubject<ConceptInformation[]>(1);
		displayOptions$.subscribe(displayOptions => {
            let result:ConceptInformation[] = [];
            let subject = "";
            let predicate = "";
			let lang = "";
			let date:Date;
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
                    date.toLocaleDateString("de-DE", {day: '2-digit', month: '2-digit', year: 'numeric'}),
					cd.predicate?cd.predicate.value+(lang?" ("+lang.toUpperCase()+")":""):"",
					!cd.addition.value?objectlabel:"",
					cd.addition.value?objectlabel:""
				]);
				if (cia.length == 0) result.push(ci);
			});
			cis.next(result);
		});
		return cis;
	}
}
