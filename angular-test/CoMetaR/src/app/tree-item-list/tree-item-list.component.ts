import { Component, OnInit, Input } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeService } from '../services/tree.service';

@Component({
  selector: 'app-tree-item-list',
  templateUrl: './tree-item-list.component.html',
  styleUrls: ['./tree-item-list.component.css']
})
export class TreeItemListComponent implements OnInit {
  @Input() treeItems:TreeItemAttributes[];
  constructor(
    private treeService:TreeService
  ) { }

  ngOnInit() {
  }

  isSelected(treeItem:TreeItemAttributes):boolean{
    return this.treeService.isSelected(treeItem.element.value)
  }

  isSearchMatch(treeItem:TreeItemAttributes):boolean{
    return this.treeService.isSearchMatch(treeItem.element.value)
  }
}
