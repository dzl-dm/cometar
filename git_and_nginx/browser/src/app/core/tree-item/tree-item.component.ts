import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, of, combineLatest, from, BehaviorSubject, Subject } from 'rxjs';
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService, TreeItemStyle, TreeItemIcon } from "../services/tree-style.service";
import { SearchResultAttributes } from '../services/queries/searchtreeitem.service';
import { withLatestFrom, map, combineAll, takeUntil, pairwise, skip } from 'rxjs/operators';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from '../concept-information/concept-information.component';
import { TreeItem } from '../classes/tree-item';
import { OntologyAccessService } from '../services/ontology-access.service';
import { trigger, state, transition, animate, style } from '@angular/animations';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('openClose', [
      /*state('void', style({
        opacity: '0',
        transform: 'translateX(50px)'
      })),
      transition('void <=> *', animate(100))*/
    ]),
    trigger('highlight', [
      transition(':enter', []),
      transition('* => *', [
        style({backgroundColor: "var(--first-color)"}),
        animate('0.5s ease-in-out', style({backgroundColor: 'inherit'}))
      ]),
    ])
  ]
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') treeitem?:TreeItem=new TreeItem({
    element:{value:""},
    isModifier:{value:false},
    label:{value:"","xml:lang":"en"},
    notations:{value:[]},
    units:{value:[]},
    status:{value:""},
    type:{value:""}
  });
  @Input() conceptIri?:string;
  @Input('expanded') initialExpanded?:boolean=false;
  @Input('cascade_expand') cascade_expand?:boolean;
  @Input() parent?:string;
  @Input() style$?:Observable<TreeItemStyle>;
  @Input() parentAnimation$:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(true);
  
  private unsubscribe: Subject<void> = new Subject();

  private searchResultAttributes$:Observable<SearchResultAttributes[]>;
  private showSearchResult$:Observable<boolean>;
  public searchResults$:Observable<string[][]>;
  public intent$:Observable<number>;
  public expanded$:Observable<boolean>;
  private conceptInformation$:Observable<ConceptInformation[]>;
  public showInformationDiv$:Observable<boolean>;
  public style:TreeItemStyle = this.treeStyleService.getEmptyStyle(this.treeitem.element.value);

  constructor(
    public treeDataService: TreeDataService,
    private treeStyleService: TreeStyleService,
    private configurationService: ConfigurationService,
    private ontologyAccessService: OntologyAccessService,
    private el: ElementRef,
    private cd: ChangeDetectorRef
  ){
  }

  ngOnInit() {
    setTimeout(()=>{
      this.intent$ = this.treeStyleService.getIntent(this.el.nativeElement);
      //this.intent$.subscribe(data => this.cd.markForCheck());
    });
    if (this.treeitem) (<HTMLElement>this.el.nativeElement).setAttribute("iri",this.treeitem.element.value);
    if (this.conceptIri) this.ontologyAccessService.getItem$(this.conceptIri)
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(ti => {
        this.treeitem = ti;
        this.load();
    });
    else this.load();

    if (this.style$)
    {
      this.style$
        .pipe(takeUntil(this.unsubscribe))
        .subscribe(()=> { 
          this.treeStyleService.onTreeDomChange("TreeItem Style added.");
        });
      this.style$
        .pipe(
          takeUntil(this.unsubscribe),
          skip(1),
          pairwise())
        .subscribe(([oldStyle,newStyle])=> {
            if (!this.compareStyles(oldStyle,newStyle)) {
              this.highlight();
            }
          }
        );
    }
  } 
  
  private compareStyles(a:TreeItemStyle,b:TreeItemStyle){
    if (!a && !b) return true;
    if (!a || !b) return false;
    let comparetosame = a.concept == b.concept
      && a.icons.map(icon => icon.id).join(",") == b.icons.map(icon => icon.id).join(",")
      && a.opacity == b.opacity
      && a.parent == b.parent
      && a["text-decoration"] == b["text-decoration"]
      && a["background-color"] == b["background-color"]
      && a["border-color"] == b["border-color"]
      && a.bubbleicons.map(icon => icon.id).join(",") == b.bubbleicons.map(icon => icon.id).join(",")
      && a.color == b.color;
    return comparetosame;
  }

  ngAfterViewInit() {
    this.treeDataService.treeItemViewCreated(this.treeitem.element.value);
  }

  public highlightValue=0;
  private highlight(){
    this.highlightValue++;
  }

  private load(){
    if (this.style$) this.style$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(style => {
        this.style = style;
    });
    if (this.initialExpanded) this.treeDataService.onExpand(this.treeitem.element.value);
    combineLatest(this.treeDataService.shownElements$,this.treeDataService.selectedIri$).subscribe(([se,iri]) => {
      let children;
      this.ontologyAccessService.getAllChildren([this.treeitem.element.value]).subscribe(data => children = data);
      if (this.treeitem.element.value==iri || children.map(c => se.includes(c)).includes(true)) {
        this.treeDataService.onExpand(this.treeitem.element.value);
      }
      this.expanded$ = this.treeDataService.expandedElements$.pipe(
        map(ees =>  ees.includes(this.treeitem.element.value))
      );
    });
    /*this.treeDataService.isAnyPathPart$(this.treeitem.element.value).pipe(
      withLatestFrom(
        /*this.treeDataService.isSelected$(this.treeitem.element.value),
        of(this.initialExpanded || false)
      )
    ).pipe(takeUntil(this.unsubscribe))
      .subscribe(next => { 
        setTimeout(()=>{this.expanded = next.includes(true)},0);
        //this.cd.markForCheck();
    });*/
    
    this.showSearchResult$ = this.treeDataService.isSearchMatch$(this.treeitem.element.value);
    this.searchResultAttributes$ = this.treeDataService.getSearchMatch$(this.treeitem.element.value).pipe(
      map(sras => {
        sras.map(sra => {
          sra.property.value = this.configurationService.getHumanReadableRDFPredicate(sra.property.value);
        });
        return sras;
      })
    );
    this.searchResults$ = this.searchResultAttributes$.pipe(map(sras => sras.map(sra => [
      sra.property.value + (sra.value['xml:lang']?" ("+sra.value['xml:lang']+")":""),
      sra.value.value
    ])));
    this.conceptInformation$ = this.treeDataService.getTreeItemConceptInformation(this.treeitem.element.value);/*this.treeDataService.conceptInformation$.pipe(
      map(cis => cis.filter(ci => ci.concept==this.treeitem.element.value))
    )*/
    this.showInformationDiv$ = combineLatest(
      this.conceptInformation$,
      this.treeDataService.getOnlyHighlightTerms(),
      this.showSearchResult$
    ).pipe(map(data => data[0].length > 0 || !data[1] && data[2] ));
    this.showInformationDiv$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((show)=> { 
        if (show) {
          this.treeStyleService.onTreeDomChange("TreeItem Information added.");
        }
      });
  }

  public onSelect(){
    this.treeDataService.onConceptSelection(this.treeitem.element.value);
    this.expandOrCollapse(true);
  }

  public navigate(iri){
    this.treeDataService.onConceptSelection(iri);
  }

  public displayItem(){
    return this.treeDataService.isSearchPathPart$(this.treeitem.element.value);
  }

  public onlyHighlightTerms(){
    if (!this.treeDataService.getOnlyHighlightTerms().getValue()){return of(false)}
    return this.treeDataService.isSearchMatch$(this.treeitem.element.value);
  }

  public getIcons():TreeItemIcon[]{
    return this.treeStyleService.getIcons(this.style);
  }
  public getBubbleIconCounter(icon:TreeItemIcon):number{
    if (!this.style.bubbleicons) return;
    let rightTypeIcons = this.style.bubbleicons.filter(bi => bi.id == icon.id);
    let distinctIcons = rightTypeIcons.filter((bi, index, self) => self.map(s => s.style.concept).indexOf(bi.style.concept) === index);
    return distinctIcons.length;
  }

  public isGhostItem(){
    return this.treeitem && this.parent && this.treeitem.ghostParents.filter(gp => gp.value == this.parent).length > 0;
  }

  private searchMatchArray(s:string):string[]{
    let index = 0;
    let result:string[] = [];
    let pattern = this.treeDataService.getSearchPattern();
    let counter = 0;
    while (index < s.length && counter < 10){
      let newindex = s.toUpperCase().indexOf(pattern.toUpperCase(),index);
      if (newindex > -1) {
        result.push(s.substring(index,newindex));
        result.push(s.substr(newindex,pattern.length));
        index = newindex+pattern.length;
      }
      else {
        result.push(s.substring(index));
        index = s.length;
      }
      counter++;
    }
    return result;
  }

  public expandOrCollapse(expand?:boolean){
    console.log("jo");
    this.treeDataService.onExpandOrCollapse(this.treeitem.element.value);
    this.treeStyleService.onTreeDomChange("TreeItem expanded.");
  }

  public onIconClick(event:Event, icon:TreeItemIcon){
    event.stopPropagation();
    let bubbleConcepts = this.style.bubbleicons.filter(bi => bi.id == icon.id).map(bi => bi.style.concept);
    if (bubbleConcepts.length>0) {
      this.treeDataService.addShownElements(bubbleConcepts);
      this.cd.markForCheck();
    }
  }
  
  public animation:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  openCloseStart(event: AnimationEvent) {
    this.treeStyleService.animationStarted();
  }
  openCloseDone(event: AnimationEvent) {
    this.animation.next(true);
    this.treeStyleService.animationFinished();
  }

  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}