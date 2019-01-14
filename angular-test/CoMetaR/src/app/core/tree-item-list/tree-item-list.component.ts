import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeDataService } from '../services/tree-data.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-tree-item-list',
  templateUrl: './tree-item-list.component.html',
  styleUrls: ['./tree-item-list.component.css'],
  animations: [
    trigger('openClose', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }),
        animate('0.2s ease-out', style({ height: '*', opacity: 1 })),
      ]),
      transition(':leave', [
        style({ height: '*', opacity: 1 }),
        animate('0.1s ease-out', style({ height: '0px', opacity: 0 })),
      ]),
    ]),
  ]
})
export class TreeItemListComponent implements OnInit {
  @Input() conceptIri:string;
  @Input('expanded') initialExpanded?:boolean;
  private treeItems$:Observable<TreeItemAttributes[]>;
  constructor(
    private treeDataService:TreeDataService
  ) { }

  ngOnInit() {
  }

  public getTreeItems(){
    let result = [];
    if (this.conceptIri == "root") this.treeDataService.getTopLevelItems$().subscribe(data => result = data);
    else this.treeDataService.getSubItems$(this.conceptIri).subscribe(data => result = data);
    return result;
  }

  isSelected$(treeItem:TreeItemAttributes):Observable<boolean>{
    return this.treeDataService.isSelected$(treeItem.element.value)
  }
}
