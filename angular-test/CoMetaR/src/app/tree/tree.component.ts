import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service';
import { TreestateService } from '../services/treestate.service';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css']
})
export class TreeComponent implements OnInit {
  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchPattern:string;
  constructor(
    private treeitemsService: TreeItemsService, 
    private route: ActivatedRoute,
    private treestateService: TreestateService
  ){}

  ngOnInit() {    
    this.treestateService.setRoute(this.route);
    this.treeItems$ = this.treeitemsService.get({range:"top"});
  }

  private performSearch(){
    this.treestateService.setSearchPattern(this.searchPattern);
  }
}