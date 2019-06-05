import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Observable, of, combineLatest, from } from 'rxjs';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service'
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService, TreeItemStyle, TreeItemIcon } from "../services/tree-style.service";
import { SearchResultAttributes } from '../services/queries/searchtreeitem.service';
import { withLatestFrom, map, combineAll } from 'rxjs/operators';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { ConceptInformation } from '../concept-information/concept-information.component';

@Component({
  selector: 'app-tree-item',
  templateUrl: './tree-item.component.html',
  styleUrls: ['./tree-item.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeItemComponent implements OnInit {
  @Input('treeItemAttributes') attributes?:TreeItemAttributes={
    element:{value:""},
    hasChildren:{value:false},
    isModifier:{value:false},
    label:{value:"","xml:lang":"en"},
    status:{value:""},
    type:{value:""}
  };
  @Input() conceptIri?:string;
  @Input('expanded') initialExpanded?:boolean;
  @Input('cascade_expand') cascade_expand?:boolean;
  @Input('') parent?:string;
  @Input('') style$?:Observable<TreeItemStyle>;
  @Input('') hasChildren$?:Observable<boolean>;

  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchResultAttributes$:Observable<SearchResultAttributes[]>;
  private showSearchResult$:Observable<boolean>;
  public searchResults$:Observable<string[][]>;
  public intent$:Observable<number>;
  public expanded:boolean;
  private conceptInformation$:Observable<ConceptInformation[]>;
  public showInformationDiv$:Observable<boolean>;
  public style:TreeItemStyle = this.treeStyleService.getEmptyStyle(this.attributes.element.value);

  constructor(
    private treeitemsService: TreeItemsService, 
    public treeDataService: TreeDataService,
    private treeStyleService: TreeStyleService,
    private configurationService: ConfigurationService,
    private el: ElementRef,
    private cd: ChangeDetectorRef
  ){
  }

  ngOnInit() {
    setTimeout(()=>{
      this.intent$ = this.treeStyleService.getIntent(this.el.nativeElement);
      this.intent$.subscribe(data => this.cd.markForCheck());
    });
    if (this.attributes) (<HTMLElement>this.el.nativeElement).setAttribute("iri",this.attributes.element.value);;
    if (this.conceptIri) this.treeitemsService.get({range:"single",iri:this.conceptIri}).subscribe(a => {
      this.attributes = a[0];
      this.load();
    });
    else this.load();
  }  
  private load(){
    if (this.style$) this.style$.subscribe(style => {
      this.style = style;
    })
    this.treeDataService.isAnyPathPart$(this.attributes.element.value).pipe(
      withLatestFrom(
        this.treeDataService.isSelected$(this.attributes.element.value),
        of(this.initialExpanded)
      )
    ).subscribe(next => { 
      this.expanded = next.includes(true);
      this.cd.markForCheck();
    });
    
    this.showSearchResult$ = this.treeDataService.isSearchMatch$(this.attributes.element.value);
    this.searchResultAttributes$ = this.treeDataService.getSearchMatch$(this.attributes.element.value).pipe(
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
    this.conceptInformation$ = this.treeDataService.conceptInformation$.pipe(
      map(cis => cis.filter(ci => ci.concept==this.attributes.element.value))
    )
    this.showInformationDiv$ = combineLatest(
      this.conceptInformation$,
      this.showSearchResult$
    ).pipe(map(data => data[0].length > 0 || data[1] ));
  }

  public onSelect(){
    this.treeDataService.onConceptSelection(this.attributes.element.value);
  }

  public navigate(iri){
    this.treeDataService.onConceptSelection(iri);
  }

  public getIcons():TreeItemIcon[]{
    return this.treeStyleService.getIcons(this.style);
  }
  public getBubbleIconCounter(icon:TreeItemIcon):number{
    if (!this.style.bubbleicons) return;
    return this.style.bubbleicons.filter(i => i.id == icon.id).length;
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
}