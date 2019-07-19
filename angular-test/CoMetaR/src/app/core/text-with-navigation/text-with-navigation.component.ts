import { Component, OnInit, Input } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';

@Component({
  selector: 'app-text-with-navigation',
  templateUrl: './text-with-navigation.component.html',
  styleUrls: ['./text-with-navigation.component.css']
})
export class TextWithNavigationComponent implements OnInit {
  @Input('') data:string|NavigationTextPart|NavigationTextPart[];
  constructor(
    private treeDataService:TreeDataService
  ) { }

  ngOnInit() {
    if (!Array.isArray(this.data)){
      let check:NavigationTextPart = this.data as NavigationTextPart
      if (check != null) this.data = <NavigationTextPart[]>[this.data];
      else this.data = {text:<string>this.data}
    }
  }

  public navigateTo(iri){
    this.treeDataService.onConceptSelection(iri);
  }

}

export interface NavigationTextPart {
  text: string,
  navigationtype?: "tree",
  navigationlink?: string,
}