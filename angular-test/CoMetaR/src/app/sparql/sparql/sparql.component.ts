import { Component, OnInit } from '@angular/core';
import { DataService, prefixes } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SearchtreeitemService } from 'src/app/core/services/queries/searchtreeitem.service';
import { UrlService } from 'src/app/services/url.service';

@Component({
  selector: 'app-sparql',
  templateUrl: './sparql.component.html',
  styleUrls: ['./sparql.component.css']
})
export class SparqlComponent implements OnInit {
  public prefixes = prefixes;
  public queries: string[][] = [];
  private concept: string;
  public queryText="";
  public resultHeadings:string[]=[];
  public results:string[][] = [];
  constructor(
    private dataService: DataService,
    private searchTreeItemService: SearchtreeitemService,
    private route:ActivatedRoute,
    private urlService:UrlService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => data.get('concept'))
    ).subscribe(data => this.concept = data && this.urlService.extendRdfPrefix(data) || "ELEMENT_ID");
    this.queries.push(["Search Items", this.searchTreeItemService.getQueryString("Test")]);
  }

  public selectionChange(newQuery:string){
    this.queryText=newQuery;
  }

  public getResults(){
    this.resultHeadings=[];
    this.results=[];
    this.dataService.getData(this.queryText).subscribe(data => { 
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
}
