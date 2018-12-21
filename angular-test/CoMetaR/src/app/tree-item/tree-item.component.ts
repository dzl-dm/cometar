import { Component, OnInit, Input } from '@angular/core';
import { Observable, Subscriber } from 'rxjs';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreestateService, TreeState } from '../services/treestate.service';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css']
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') attributes:TreeItemAttributes;
  //@Input() treeState:TreeState;
  private treeItems$:Observable<TreeItemAttributes[]>;
  private clickExpanded:boolean;
  constructor(
    private treeitemsService: TreeItemsService, 
    private treestateService: TreestateService
  ){}

  ngOnInit() {
    this.treeItems$ = this.treeitemsService.get({range:"sub",iri:this.attributes.element.value});
  }

  private showItem():boolean{
    if (this.treestateService.isTreePathPart(this.attributes.element.value)) return true;
    if (this.treestateService.searchActivated()&&!this.treestateService.isSearchMatch(this.attributes.element.value)) return false;
    return true;
    /*if (this.treeState.searchPattern == '' || !this.attributes.label) return true;
    if(this.attributes.label.value.toUpperCase().match(new RegExp(this.treeState.searchPattern.toUpperCase()))) return true;
    return false;*/
  }

  private showItemList():boolean{
    if (this.clickExpanded != undefined) return this.clickExpanded;
    return this.treestateService.isTreePathPart(this.attributes.element.value);
  }

  private getExpansionClass(){
    return {
      'treeItemExpand':true,
      'expanded':this.attributes.hasChildren.value && this.showItemList(),
      'collapsed':this.attributes.hasChildren.value && !this.showItemList()
    }
  }

  private onSelect(){
    this.treestateService.onConceptSelection(this.attributes.element.value)
  }
}