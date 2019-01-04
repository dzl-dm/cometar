import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { TreeItemsService, TreeItemAttributes } from '../../services/queries/treeitems.service'
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService } from "../services/tree-style.service";
import { SearchResultAttributes } from '../../services/queries/searchtreeitem.service';
import { withLatestFrom, map } from 'rxjs/operators';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css']
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') attributes?:TreeItemAttributes={
    element:{value:""},
    hasChildren:{value:false},
    isModifier:{value:false},
    label:{value:"","xml:lang":"en"},
    status:{value:""},
    type:{value:""}
  };
  @Input() conceptIri?:string;

  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchResultAttributes$:Observable<SearchResultAttributes>;
  private expanded:boolean;
  private showSearchResult$:Observable<boolean>;
  private informationDivLeftOffset$:Observable<number>;
  constructor(
    private treeitemsService: TreeItemsService, 
    private treeDataService: TreeDataService,
    private treeStyleService: TreeStyleService,
    private el: ElementRef  
  ){
  }

  ngOnInit() {
    setTimeout(()=>{
      this.informationDivLeftOffset$ = this.treeStyleService.createdTreeItem(this.el.nativeElement);
    });
    if (this.conceptIri) this.treeitemsService.get({range:"single",iri:this.conceptIri}).subscribe(a => {
      this.attributes = a[0];
      this.load();
    });
    else this.load();
  }  
  private load(){
    this.treeDataService.isAnyPathPart$(this.attributes.element.value).pipe(
      withLatestFrom(this.treeDataService.isSelected$(this.attributes.element.value))
    ).subscribe(next => this.expanded = next.includes(true));
    
    this.showSearchResult$ = this.treeDataService.isSearchMatch$(this.attributes.element.value);
    this.searchResultAttributes$ = this.treeDataService.getSearchMatch$(this.attributes.element.value);
  }

  private onSelect(){
    this.treeDataService.onConceptSelection(this.attributes.element.value);
  }

  private searchMatchArray(s:string):string[]{
    let index = 0;
    let result:string[] = [];
    let pattern = this.treeDataService.getSearchPattern();
    let counter = 0;
    while (index < s.length && counter < 10){
      let newindex = s.toUpperCase().indexOf(pattern.toUpperCase(),index);
      if (newindex > -1) {
        result.push(s.substring(index,newindex));
        result.push(s.substr(newindex,pattern.length));
        index = newindex+pattern.length;
      }
      else {
        result.push(s.substring(index));
        index = s.length;
      }
      counter++;
    }
    return result;
  }
}