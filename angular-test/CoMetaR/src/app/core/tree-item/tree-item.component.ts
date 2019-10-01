import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, of, combineLatest, from, BehaviorSubject, Subject } from 'rxjs';
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService, TreeItemStyle, TreeItemIcon } from "../services/tree-style.service";
import { SearchResultAttributes } from '../services/queries/searchtreeitem.service';
import { withLatestFrom, map, combineAll, takeUntil } from 'rxjs/operators';
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
      state('void', style({
        opacity: '0',
        transform: 'translateX(50px)'
      })),
      transition('void <=> *', animate(100))
    ]),
  ]
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') treeitem?:TreeItem=new TreeItem({
    element:{value:""},
    isModifier:{value:false},
    label:{value:"","xml:lang":"en"},
    notations:{value:[]},
    status:{value:""},
    type:{value:""}
  });
  @Input() conceptIri?:string;
  @Input('expanded') initialExpanded?:boolean=false;
  @Input('cascade_expand') cascade_expand?:boolean;
  @Input('') parent?:string;
  @Input('') style$?:Observable<TreeItemStyle>;
  @Input('') parentAnimation$:BehaviorSubject<boolean>=new BehaviorSubject<boolean>(true);
  
  private unsubscribe: Subject<void> = new Subject();

  private searchResultAttributes$:Observable<SearchResultAttributes[]>;
  private showSearchResult$:Observable<boolean>;
  public searchResults$:Observable<string[][]>;
  public intent$:Observable<number>;
  public expanded:boolean;
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
    if (this.style$)this.style$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(()=> { this.treeStyleService.onTreeDomChange("TreeItem Style added.") });
  }  

  ngAfterViewInit() {
    this.treeDataService.treeItemViewCreated(this.treeitem.element.value);
  }

  private load(){
    if (this.style$) this.style$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe(style => {
        this.style = style;
    });
    this.treeDataService.isAnyPathPart$(this.treeitem.element.value).pipe(
      withLatestFrom(
        this.treeDataService.isSelected$(this.treeitem.element.value),
        of(this.initialExpanded || false)
      )
    ).pipe(takeUntil(this.unsubscribe))
      .subscribe(next => { 
        setTimeout(()=>{this.expanded = next.includes(true)},0);
        //this.cd.markForCheck();
    });
    
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
      this.showSearchResult$
    ).pipe(map(data => data[0].length > 0 || data[1] ));
    this.showInformationDiv$
      .pipe(takeUntil(this.unsubscribe))
      .subscribe((show)=> { if (show) this.treeStyleService.onTreeDomChange("TreeItem Information added.") });
  }

  public onSelect(){
    this.treeDataService.onConceptSelection(this.treeitem.element.value);
  }

  public navigate(iri){
    this.treeDataService.onConceptSelection(iri);
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

  public expandOrCollapse(){
    this.expanded=!this.expanded;
    this.treeStyleService.onTreeDomChange("TreeItem expanded.");
  }

  public onIconClick(event:Event, icon:TreeItemIcon){
    event.stopPropagation();
    let bubbleConcepts = this.style.bubbleicons.filter(bi => bi.id == icon.id).map(bi => bi.style.concept);
    if (bubbleConcepts.length>0) {
      this.treeDataService.openedElements$.next(bubbleConcepts);
      this.cd.markForCheck();
    }
  }

  private cloneRemoveFunction;
  public onInformationMouseEnter(event:MouseEvent){
    let informationDiv = <HTMLElement>event.target
    let clone = <HTMLElement>informationDiv.cloneNode(true);
    let left = informationDiv.getBoundingClientRect().left;
    let maxWidth = Math.min(1000,window.innerWidth-left-20);
    if (informationDiv.offsetWidth > 1000){
      maxWidth = informationDiv.offsetWidth;
    }
    let top = informationDiv.getBoundingClientRect().top;
    let maxHeight = Math.min(500,window.innerHeight-top-20);
    clone.classList.add("hoveredInformationDiv");
    (<HTMLElement>clone.getElementsByClassName("conceptInformationTable")[0]).classList.remove("truncateText");
    clone.setAttribute("style","left:"+left+"px;top:"+top+"px;max-height:"+maxHeight+"px;width:"+maxWidth+"px;");
    let mouseX = event.x;
    let mouseY = event.y;
    this.cloneRemoveFunction = (event)=>{
      if (event.type == "mousemove"){
        mouseX = event.x;
        mouseY = event.y;
      }
      if (mouseX < informationDiv.getBoundingClientRect().left || mouseX > informationDiv.getBoundingClientRect().left + informationDiv.offsetWidth 
        || mouseY < informationDiv.getBoundingClientRect().top || mouseY > informationDiv.getBoundingClientRect().top + informationDiv.offsetHeight){
        clone.remove();
        document.body.removeEventListener("mousemove",this.cloneRemoveFunction);
        document.getElementById("tree").removeEventListener("scroll",this.cloneRemoveFunction);
      }
    }
    document.body.addEventListener("mousemove",this.cloneRemoveFunction);
    document.getElementById("tree").addEventListener("scroll",this.cloneRemoveFunction);
    document.body.append(clone);
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
    document.body.removeEventListener("mosuemove",this.cloneRemoveFunction);
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}