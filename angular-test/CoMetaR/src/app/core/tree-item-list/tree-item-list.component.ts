import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeDataService } from '../services/tree-data.service';
import { trigger, style, transition, animate } from '@angular/animations';
import { Observable } from 'rxjs';
import { TreeStyleService } from '../services/tree-style.service';
import { TreepathitemsService } from '../services/queries/treepathitems.service';

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
  @Input('expanded') expanded?:boolean;
  @Input('cascade_expand') cascade_expand?:boolean;
  private treeItems$:Observable<TreeItemAttributes[]>;
  constructor(
    private treeDataService:TreeDataService,
    private cd: ChangeDetectorRef,
    public treeStyleService:TreeStyleService,
    public treepathitemService:TreepathitemsService
  ) { }

  ngOnInit() {
  }

  public style = [];
  public getTreeItems(){
    let result:TreeItemAttributes[] = [];
    if (this.conceptIri == "root") {
      this.treeDataService.getTopLevelItems$().subscribe(data => result = data);
      this.expanded = true;
    }
    else this.treeDataService.getSubItems$(this.conceptIri).subscribe(data => { 
      result = data;
      this.cd.markForCheck();
    });
    this.style = result.map(iri => this.treeStyleService.getTreeItemStyle$(iri.element.value))
    return result;
  }

  isSelected$(treeItem:TreeItemAttributes):Observable<boolean>{
    return this.treeDataService.isSelected$(treeItem.element.value)
  }
}
