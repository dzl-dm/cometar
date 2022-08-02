import { Component, OnInit } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SearchtreeitemService } from 'src/app/core/services/queries/searchtreeitem.service';
import { UrlService } from 'src/app/services/url.service';
import { OntologyDataService } from 'src/app/core/services/ontology-data.service';
import { CommitHistoryService } from 'src/app/core/services/queries/commit-history.service';
import { InformationQueryService } from 'src/app/detailed-information/services/queries/information-query.service';
import { CommitDetailsService } from 'src/app/provenance/services/queries/commit-details.service';
import { CommitMetaDataService } from 'src/app/provenance/services/queries/commit-meta-data.service';
import { ConceptByNotationService } from 'src/app/upload-client-configuration/services/queries/concept-by-notation.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
  selector: 'app-sparql',
  templateUrl: './sparql.component.html',
  styleUrls: ['./sparql.component.css']
})
export class SparqlComponent implements OnInit {
  public prefixes;
  public queries: string[][] = [];
  private concept: string;
  public queryText="";
  public resultHeadings:string[]=[];
  public results:string[][] = [];
  constructor(
    private dataService: DataService,
    private searchTreeItemService: SearchtreeitemService,
    private route:ActivatedRoute,
    private urlService:UrlService,
    private ontologyDataService:OntologyDataService,
    private commitHistoryService:CommitHistoryService,
    private informationQueryService:InformationQueryService,
    private commitDetailsService:CommitDetailsService,
    private commitMetaDataService:CommitMetaDataService,
    private conceptByNotationService:ConceptByNotationService,
    private configurationService: ConfigurationService
  ) { 
    this.prefixes=dataService.prefixes
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => data.get('concept'))
    ).subscribe(data => this.concept = data && data || "ELEMENT_ID");
    this.queries.push(["Search Items", this.searchTreeItemService.getQueryString("Test")]);
    this.queries.push(["Root Items", this.ontologyDataService.getRootElementsQueryString()]);
    this.queries.push(["Commit History", this.commitHistoryService.getQueryString(new Date("2019-05-01"),new Date("2019-07-01"))]);
    this.queries.push(["Concept Information", this.informationQueryService.getQueryString("http://loinc.org/owl#39156-5")]);
    this.queries.push(["Commit Overview", this.commitMetaDataService.getQueryString(new Date("2019-05-01"),new Date("2019-07-01"))]);
    this.queries.push(["Commit Details", this.commitDetailsService.getQueryString(":commit_6ab3748ab7ca5af2c472fe8708269cf1e08f33e4")]);
    this.queries.push(["Notation Updates", this.conceptByNotationService.getQueryString("S:91302008",new Date("2019-05-01"))]);
  }

  public selectionChange(newQuery:string){
    this.queryText=newQuery;
  }

  public getResults(){
    this.resultHeadings=[];
    this.results=[];
    this.dataService.getData(this.queryText, "SPARQL module query").subscribe(data => { 
      if (data.length == 0 || data.length == 1 && Object.keys(data[0]).length==0) {
        this.resultHeadings.push("No Results.");
      }
      data.forEach(row => {
        let newRow = [];
        Object.keys(row).forEach((key,value) => {
          if (!this.resultHeadings.includes(key)) {
            this.resultHeadings.push(key);
            this.results.forEach(result => result[this.resultHeadings.indexOf(key)]="");
          }
          newRow[this.resultHeadings.indexOf(key)] = row[key].value;
        });
        this.results.push(newRow);
      });
    });
  }

  public downloadResults(){
    let resultText = "";
    resultText+=this.resultHeadings.map(r => "\""+r+"\"").join(";");
    resultText += "\n";
    this.results.forEach(row => {
      for (let i = 0; i < this.resultHeadings.length; i++){
        if (i > 0) resultText+=";";
        resultText+="\"";
        resultText+=row[i]?row[i]:"";
        resultText+="\"";
      }
      resultText += "\n";
    });
    let thefile = new Blob([resultText], { type: "application/octet-stream" });
    let anchor = document.createElement('a');

    anchor.download = "result.csv";
    anchor.href = window.URL.createObjectURL(thefile);
    anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
    anchor.click();
  }

  public getConfig(){
    return this.configurationService.settings
  }
}
