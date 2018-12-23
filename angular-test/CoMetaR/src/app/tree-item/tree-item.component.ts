import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { Observable, Subscriber, pipe } from 'rxjs';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeService, TreeState } from '../services/tree.service';
import { SearchResultAttributes } from '../services/queries/searchtreeitem.service';
import { TreeItemListComponent } from '../tree-item-list/tree-item-list.component';
import { TreeComponent } from '../tree/tree.component';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css']
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') attributes:TreeItemAttributes;

  private treeItems$:Observable<TreeItemAttributes[]>;
  private clickExpanded:boolean;
  private searchResultAttributes = {};
  constructor(
    private treeitemsService: TreeItemsService, 
    private treeService: TreeService,
    private treeComponent: TreeComponent,
    private el: ElementRef  
  ){}

  ngOnInit() {
    this.treeItems$ = this.treeService.getSubItems(this.attributes.element.value);
    if (this.treeService.searchActivated()) this.searchResultAttributes = this.treeService.getSearchMatch(this.attributes.element.value);
    setTimeout(()=>this.treeService.updateInformationDivWidth(this.el.nativeElement.offsetWidth));
  }

  private showItemList():boolean{
    if (this.clickExpanded != undefined) return this.clickExpanded;
    return this.treeService.isTreePathPart(this.attributes.element.value);
  }

  private showSearchResult():boolean{
    return this.treeService.searchActivated() 
      && this.attributes.element 
      && this.treeService.getSearchMatch(this.attributes.element.value)
      && Object.keys(this.treeService.getSearchMatch(this.attributes.element.value)).length > 0
  }

  private getExpansionClass(){
    return {
      'treeItemExpand':true,
      'expanded':this.attributes.hasChildren.value && this.showItemList(),
      'collapsed':this.attributes.hasChildren.value && !this.showItemList()
    }
  }

  private onSelect(){
    this.treeService.onConceptSelection(this.attributes.element.value)
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