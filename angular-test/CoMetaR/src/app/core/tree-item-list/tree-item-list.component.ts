import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeDataService } from '../services/tree-data.service';
import { trigger, style, transition, animate, AnimationEvent } from '@angular/animations';
import { Observable, BehaviorSubject } from 'rxjs';
import { TreeStyleService } from '../services/tree-style.service';
import { OntologyAccessService } from '../services/ontology-access.service';
import { TreeItem } from '../classes/tree-item';

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
        animate('0.5s ease-out', style({ height: '0px', opacity: 0 })),
      ]),
    ]),
  ]
})
export class TreeItemListComponent implements OnInit {
  @Input() conceptIri:string;
  @Input('expanded') expanded?:boolean;
  @Input('cascade_expand') cascade_expand?:boolean;
  constructor(
    private treeDataService:TreeDataService,
    private cd: ChangeDetectorRef,
    public treeStyleService:TreeStyleService,
    private ontologyAccessService: OntologyAccessService
  ) { }

  ngOnInit() {
    if (this.conceptIri == "root") {
      this.treeItems$ = this.ontologyAccessService.getTopLevelItems$();
      this.expanded = true;
    }
    else this.treeItems$ = this.ontologyAccessService.getSubItems$(this.conceptIri);
    this.treeItems$.subscribe(data => { 
      //this.cd.markForCheck();
    });
  }

  public treeItems$ = new Observable<TreeItem[]>();
  /*public getTreeItems(){
    let result:TreeItemAttributes[] = [];
    if (this.conceptIri == "root") {
      this.treeDataService.getTopLevelItems$().subscribe(data => {
        result = data;
        this.cd.markForCheck();
      });
      this.expanded = true;
    }
    else this.treeDataService.getSubItems$(this.conceptIri).subscribe(data => { 
      console.log(data);
      result = data;
      this.cd.markForCheck();
    });
    return result;
  }*/

  isSelected$(treeItem:TreeItem):Observable<boolean>{
    return this.treeDataService.isSelected$(treeItem.element.value)
  }

  openCloseDone(event: AnimationEvent) {
    console.log(event);
    (<HTMLElement>event.element).removeAttribute("animating");
    let animatingElements:number = Array.from(document.getElementById("tree").getElementsByTagName("APP-TREE-ITEM")).filter((a:HTMLElement)=>a.hasAttribute("animating")).length;
    if (animatingElements == 0) {
      this.treeStyleService.onTreeDomChange("All expand animations finished.");
    }
  }
}
