import { Component, OnInit, Input } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';
import { OntologyAccessService } from '../services/ontology-access.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-text-with-navigation',
  templateUrl: './text-with-navigation.component.html',
  styleUrls: ['./text-with-navigation.component.css']
})
export class TextWithNavigationComponent implements OnInit {
  @Input() data:string|NavigationTextPart|NavigationTextPart[];
  public dataarray:NavigationTextPart[];
  constructor(
    private treeDataService:TreeDataService,
    private ontologyAccessService:OntologyAccessService
  ) { }

  ngOnInit() {
    if (!Array.isArray(this.data)){
      if (typeof this.data == "string") {
        this.dataarray = [{text:<string>this.data}]
      }
      else {
        this.dataarray = <NavigationTextPart[]>[this.data];
      }
    }
    else this.dataarray = this.data;
    this.dataarray.forEach(da => {
      if (!da.text){
        da.text = "";
        if (da.navigationtype == "tree" && da.navigationlink){
          this.ontologyAccessService.getItem$(da.navigationlink).subscribe(ti => {
            da.text = ti.label.value;
          });
        }
      }
    });
  }

  public navigateTo(iri){
    this.treeDataService.onConceptSelection(iri);
  }

}

export interface NavigationTextPart {
  text?: string,
  navigationtype?: "tree",
  navigationlink?: string,
}