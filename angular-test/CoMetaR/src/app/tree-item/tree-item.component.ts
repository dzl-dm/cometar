import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeService } from '../services/tree.service';
import { SearchResultAttributes } from '../services/queries/searchtreeitem.service';
import { TreeItemListComponent } from '../tree-item-list/tree-item-list.component';
import { TreeComponent } from '../tree/tree.component';
import { withLatestFrom } from 'rxjs/operators';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css']
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') attributes:TreeItemAttributes;

  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchResultAttributes$:Observable<SearchResultAttributes>;
  private expanded:boolean;
  private showSearchResult$:Observable<boolean>;
  private informationDivLeftOffset$:Observable<number>;
  constructor(
    private treeitemsService: TreeItemsService, 
    private treeService: TreeService,
    private treeComponent: TreeComponent,
    private el: ElementRef  
  ){
  }

  ngOnInit() {
    setTimeout(()=>{
      this.informationDivLeftOffset$ = this.treeService.updateInformationDivMaxLeft(this.el.nativeElement);
    });

    this.treeService.isAnyPathPart$(this.attributes.element.value).pipe(
      withLatestFrom(this.treeService.isSelected$(this.attributes.element.value))
    ).subscribe(next => this.expanded = next.includes(true));
    
    this.showSearchResult$ = this.treeService.isSearchMatch$(this.attributes.element.value);
    this.searchResultAttributes$ = this.treeService.getSearchMatch$(this.attributes.element.value);
  }  

  private onSelect(){
    this.treeService.onConceptSelection(this.attributes.element.value);
  }

  private searchMatchArray(s:string):string[]{
    let index = 0;
    let result:string[] = [];
    let pattern = this.treeService.getSearchPattern();
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