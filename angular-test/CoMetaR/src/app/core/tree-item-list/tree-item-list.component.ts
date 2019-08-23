import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';
import { trigger, style, transition, animate, AnimationEvent } from '@angular/animations';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
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
        animate('0.2s ease-out', style({ height: '0px', opacity: 0 })),
      ]),
    ]),
  ]
})
export class TreeItemListComponent implements OnInit {
  @Input() conceptIri:string;
  @Input('expanded') expanded?:boolean;
  @Input('cascade_expand') cascade_expand?:boolean;
  public animations:BehaviorSubject<boolean>[];
  constructor(
    private treeDataService:TreeDataService,
    private cd: ChangeDetectorRef,
    public treeStyleService:TreeStyleService,
    private ontologyAccessService: OntologyAccessService
  ) { }

  public treeItems:TreeItem[] = [];
  ngOnInit() {
    if (this.conceptIri == "root") {
      this.ontologyAccessService.getTopLevelItems$().subscribe(tis => {
        this.animations=tis.map(t => new BehaviorSubject<boolean>(false));
        this.treeItems = tis; 
        this.cd.markForCheck();
      });
      this.expanded = true;
    }
    else this.ontologyAccessService.getSubItems$(this.conceptIri).subscribe(tis => {
      this.animations=tis.map(t => new BehaviorSubject<boolean>(false));
      this.treeItems=tis;
    });
    this.treeItems$.subscribe(data => { 
      //this.cd.markForCheck();
    });
  }

  public treeItems$ = new Observable<TreeItem[]>();

  isSelected$(treeItem:TreeItem):Observable<boolean>{
    return this.treeDataService.isSelected$(treeItem.element.value)
  }

  openCloseStart(event: AnimationEvent) {
    this.treeStyleService.animationStarted();
  }
  openCloseDone(event: AnimationEvent, index) {
    (<HTMLElement>event.element).removeAttribute("animating");
    this.animations[index].next(true);
    this.treeStyleService.animationFinished();
  }
}
