import { Component, OnInit, Input } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeService } from '../services/tree.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'app-tree-item-list',
  templateUrl: './tree-item-list.component.html',
  styleUrls: ['./tree-item-list.component.css'],
  animations: [
    trigger('openClose', [
      transition(':enter', [
        style({ height: '0px', opacity: 0 }),
        animate('0.1s ease-out', style({ height: '*', opacity: 1 })),
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
  private treeItems$:Observable<TreeItemAttributes[]>;
  constructor(
    private treeService:TreeService
  ) { }

  ngOnInit() {
    if (this.conceptIri == "root") this.treeItems$ = this.treeService.getTopLevelItems$();
    else this.treeItems$ = this.treeService.getSubItems$(this.conceptIri);
  }

  isSelected$(treeItem:TreeItemAttributes):Observable<boolean>{
    return this.treeService.isSelected$(treeItem.element.value)
  }
}
