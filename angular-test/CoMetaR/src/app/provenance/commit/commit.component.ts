import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { CommitMetaData } from '../services/queries/commit-meta-data.service';
import { Observable } from 'rxjs';
import { CommitDetails, CommitDetailsService } from '../services/queries/commit-details.service';
import { CommitDetailsComponent } from '../commit-details/commit-details.component';
import { TreeDataService, ConceptInformation } from 'src/app/core/services/tree-data.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
  selector: 'app-commit',
  templateUrl: './commit.component.html',
  styleUrls: ['./commit.component.css']
})
export class CommitComponent implements OnInit {
  @Input() commitMetaData:CommitMetaData;
  private commitDetails:CommitDetails[]=[];
  private categories={};
  constructor(
    private commitDetailsService:CommitDetailsService,
    private treeDataService:TreeDataService,
    private configuration:ConfigurationService
  ) { }

  ngOnInit() {
    this.commitDetailsService.get(this.commitMetaData.commitid.value).subscribe(data => {
      this.commitDetails=data;
      this.commitDetails.forEach(cd => {
        let category = this.configuration.getCategory(cd);
        if (!category) return;
        if (this.categories[category]) this.categories[category]++;
        else this.categories[category] = 1;
      });
    });
    this.commitMetaData=this.configuration.getHumanReadableCommitMetaData(this.commitMetaData);
  }
  onClick(){
    let result:ConceptInformation[] = [];
    this.commitDetails.forEach(cd => {
      cd = this.configuration.getHumanReadableCommitDetailData(cd);
      let cia = result.filter(r => r.concept == cd.subject.value);
      let ci:ConceptInformation = cia[0] || { 
        concept: cd.subject.value,
        headings: ["Attribute","Old Value","New Value"],
        sourceId: this.commitMetaData.commitid.value,
        cells:[]
      };
      ci.cells.push([
        cd.predicate?cd.predicate.value:"",
        cd.ool?cd.ool.value:cd.oldobject?cd.oldobject.value:"",
        cd.nol?cd.nol.value:cd.newobject?cd.newobject.value:""
      ]);
      if (cia.length == 0) result.push(ci);
    });
    this.treeDataService.addConceptInformation(result);
  }
}
