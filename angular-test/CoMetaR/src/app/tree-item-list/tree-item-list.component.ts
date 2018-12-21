import { Component, OnInit, Input } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreestateService } from '../services/treestate.service';
import { Observable } from 'rxjs';
import { SearchService } from '../services/search.service';

@Component({
  selector: 'app-tree-item-list',
  templateUrl: './tree-item-list.component.html',
  styleUrls: ['./tree-item-list.component.css']
})
export class TreeItemListComponent implements OnInit {
  @Input() treeItems:TreeItemAttributes[];
  constructor(
    private treestateService:TreestateService,
    private searchService:SearchService
  ) { }

  ngOnInit() {

  }

  isSelected(treeItem:TreeItemAttributes):boolean{
    return this.treestateService.isSelected(treeItem.element.value)
  }

  isSearchMatch(treeItem:TreeItemAttributes):boolean{
    return this.treestateService.isSearchMatch(treeItem.element.value)
  }
}
