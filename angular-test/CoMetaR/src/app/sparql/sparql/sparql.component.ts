import { Component, OnInit } from '@angular/core';
import { DataService, prefixes } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';
import { ActivatedRoute } from '@angular/router';
import { SearchtreeitemService } from 'src/app/core/services/queries/searchtreeitem.service';
import { TreeItemsService } from 'src/app/core/services/queries/treeitems.service';
import { TreepathitemsService } from 'src/app/core/services/queries/treepathitems.service';
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
    private treeItemsService: TreeItemsService,
    private treePathItemsService: TreepathitemsService,
    private route:ActivatedRoute,
    private urlService:UrlService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => data.get('concept'))
    ).subscribe(data => this.concept = data && this.urlService.extendRdfPrefix(data) || "ELEMENT_ID");
    console.log(this.concept);
    this.queries.push(["Tree Path Items", this.treePathItemsService.getQueryString([this.concept])]);
    this.queries.push(["Top Tree Items", this.treeItemsService.getQueryString("top",this.concept)]);
    this.queries.push(["Sub Tree Items", this.treeItemsService.getQueryString("sub",this.concept)]);
    this.queries.push(["Single Tree Item", this.treeItemsService.getQueryString("single",this.concept)]);
    this.queries.push(["Search Items", this.searchTreeItemService.getQueryString("Test")]);
  }

  public selectionChange(newQuery:string){
    this.queryText=newQuery;
  }

  public getResults(){
    this.resultHeadings=[];
    this.results=[];
    this.dataService.getData(this.queryText).subscribe(data => { 
      console.log(data);
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
    resultText+=this.resultHeadings.join(";");
    resultText += "\n";
    this.results.forEach(row => {
      for (let i = 0; i < this.resultHeadings.length; i++){
        if (i > 0) resultText+=";";
        resultText+=row[i]?row[i]:"";
      }
      resultText += "\n";
    });
    let thefile = new Blob([resultText], { type: "application/octet-stream" });
		let url = window.URL.createObjectURL(thefile);
		window.open(url);
  }
}
