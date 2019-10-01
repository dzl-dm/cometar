import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';
import { trigger, style, transition, animate, AnimationEvent, state } from '@angular/animations';
import { Observable, BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { TreeStyleService } from '../services/tree-style.service';
import { OntologyAccessService } from '../services/ontology-access.service';
import { TreeItem } from '../classes/tree-item';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-tree-item-list',
  templateUrl: './tree-item-list.component.html',
  styleUrls: ['./tree-item-list.component.css'],
  animations: [
    trigger('openClose', [
      /*state('void', style({
        opacity: '0'
      })),
      transition('void <=> *', animate(1000)),
      transition(':enter', [
        style({ maxHeight: '0px', opacity: 0, fontSize: '0px' }),
        animate('0.2s ease-out', style({ maxHeight: '30px', opacity: 1, fontSize: '15px' })),
      ]),
      transition(':leave', [
        style({ maxHeight: '30px', opacity: 1 }),
        animate('0.2s ease-out', style({ maxHeight: '0px', opacity: 0 })),
      ]),*/
    ]),
  ]
})
export class TreeItemListComponent implements OnInit {
  @Input() conceptIri:string;
  @Input('expanded') expanded?:boolean;
  @Input('cascade_expand') cascade_expand?:boolean;
  @Input('animation') animation?:BehaviorSubject<boolean>;
  //public animations:BehaviorSubject<boolean>[];
  
  private unsubscribe: Subject<void> = new Subject();
  
  constructor(
    private treeDataService:TreeDataService,
    private cd: ChangeDetectorRef,
    public treeStyleService:TreeStyleService,
    private ontologyAccessService: OntologyAccessService
  ) { }

  public treeItems:TreeItem[] = [];
  ngOnInit() {
    if (this.conceptIri == "root") {
      this.ontologyAccessService.getTopLevelItems$().pipe(takeUntil(this.unsubscribe)).subscribe(tis => {
        //this.animations=tis.map(t => new BehaviorSubject<boolean>(false));
        this.treeItems = tis; 
        this.cd.markForCheck();
      });
      this.expanded = true;
    }
    else this.ontologyAccessService.getSubItems$(this.conceptIri).pipe(takeUntil(this.unsubscribe)).subscribe(tis => {
      //this.animations=tis.map(t => new BehaviorSubject<boolean>(false));
      this.treeItems=tis;
    });
    this.treeItems$.pipe(takeUntil(this.unsubscribe)).subscribe(data => { 
      //this.cd.markForCheck();
    });
  }

  public treeItems$ = new Observable<TreeItem[]>();

  isSelected$(treeItem:TreeItem):Observable<boolean>{
    return this.treeDataService.isSelected$(treeItem.element.value)
  }

  /*openCloseStart(event: AnimationEvent) {
    this.treeStyleService.animationStarted();
  }
  openCloseDone(event: AnimationEvent, index) {
    (<HTMLElement>event.element).removeAttribute("animating");
    this.animations[index].next(true);
    this.treeStyleService.animationFinished();
  }*/

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
