import { Injectable, ElementRef } from '@angular/core';
import { map, flatMap, filter, distinct, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Observable, combineLatest, ReplaySubject, BehaviorSubject, Subject } from 'rxjs';
import { SearchResultAttributes, SearchtreeitemService } from './queries/searchtreeitem.service';
import { TreeItemAttributes, TreeItemsService } from './queries/treeitems.service';
import { ActivatedRoute, Router } from '@angular/router';
import { TreepathitemsService } from './queries/treepathitems.service';
import { UrlService } from '../../services/url.service'
import { Component } from '@angular/compiler/src/core';
import { ConceptInformation } from '../concept-information/concept-information.component';
import { TreeStyleService } from './tree-style.service';

@Injectable({
  providedIn: 'root'
})
export class TreeDataService {

  private route:ActivatedRoute;

  private selectedIri$:ReplaySubject<string>;
  private selectedPaths$:Observable<string[]>;
  private searchPaths$:Observable<string[]>;
  private searchPattern$:ReplaySubject<string>;
  private searchIris$:Observable<string[]>;
  private informationPaths$:Observable<string[]>;
  public openedElements$:BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  public searchActivated$:Observable<boolean>;
  public conceptInformation$:BehaviorSubject<ConceptInformation[]> = new BehaviorSubject<ConceptInformation[]>([]);
  public reset$ = new Subject();

  private claimWidth=(number)=>{};

  constructor(
    private treeitemsService: TreeItemsService, 
    private treepathitemsService: TreepathitemsService, 
    private router: Router,
    private searchtreeitemService: SearchtreeitemService,
    private urlService: UrlService,
    private treeStyleService: TreeStyleService
  ) {
    this.selectedIri$ = new ReplaySubject(1);
    this.searchPattern$ = new ReplaySubject(1);
    this.searchActivated$ = this.searchPattern$.pipe(map(searchPattern => searchPattern != ""));
    this.selectedIri$.subscribe(()=>this.openedElements$.next([]));
    this.selectedPaths$ = combineLatest(this.selectedIri$, this.openedElements$).pipe(
      flatMap(([iri,iris]) => this.treepathitemsService.getAllAncestors(iris.concat(iri)))
    )
    this.searchIris$ = this.searchPattern$.pipe(
      distinctUntilChanged(),
      flatMap(pattern => this.searchtreeitemService.get(pattern).pipe(
        map(searchResultAttributes => searchResultAttributes.map(e => e.element.value))
      ))
    )
    this.searchPaths$ = this.searchIris$.pipe(
      flatMap(iris => this.treepathitemsService.getAllAncestors(iris))
    ) 
    this.informationPaths$ = this.conceptInformation$.pipe(
      flatMap(cis => this.treepathitemsService.getAllAncestors(cis.map(ci => ci.concept)))
    )   
  }

  public reset(){
    this.conceptInformation$.next([]);
    this.openedElements$.next([]);
    this.reset$.next();
  }

  //init (through tree component)
  public init(route:ActivatedRoute, claimWidth:(number)=>void){
    route.queryParamMap.pipe(
      map(data => this.urlService.extendRdfPrefix(data.get('concept')))
    ).subscribe(this.selectedIri$);
    route.queryParamMap.pipe(
      map(data => data.get('searchpattern') ? data.get('searchpattern') : "")
    ).subscribe(this.searchPattern$);
    this.claimWidth=claimWidth;
    route.queryParamMap.subscribe(()=>{
      setTimeout(()=>this.treeStyleService.onTreeDomChange(),0);
    })
  }

  //selection
  public onConceptSelection(iri:string):void{
    this.router.navigate(["details"],{ queryParams: {concept: this.urlService.shortenRdfPrefix(iri)}, queryParamsHandling: "merge" });
  }
  public isSelected$(iri:string):Observable<boolean>{
    return this.selectedIri$.pipe(
      map(selectedIri => selectedIri == iri)
    )
  }

  //item offering
  public getTopLevelItems$():Observable<TreeItemAttributes[]>{
    return this.searchItemFilter(this.treeitemsService.get({range:"top"}));
  }
  public getSubItems$(iri:string):Observable<TreeItemAttributes[]>{
    return this.searchItemFilter(this.treeitemsService.get({range:"sub",iri:iri}));
  }
  public isSelectedPathPart$(iri:string):Observable<boolean>{
    return this.selectedPaths$.pipe(
      map(selectedPaths => selectedPaths.includes(iri))
    )
  }
  public isSearchPathPart$(iri:string):Observable<boolean>{
    return this.searchPaths$.pipe(
      map(searchPaths => searchPaths.includes(iri))
    )
  }
  public isAnyPathPart$(iri:string):Observable<boolean>{
    return combineLatest(this.isSelectedPathPart$(iri), this.isSearchPathPart$(iri)/*, this.isInformationPathPart$(iri)*/).pipe(
      map(data => data.includes(true))
    )
  }
  private searchItemFilter(o:Observable<TreeItemAttributes[]>):Observable<TreeItemAttributes[]>{
    return combineLatest(o, this.searchIris$, this.searchPaths$, this.searchActivated$).pipe(
      map(data => {
        let tias = <TreeItemAttributes[]> data[0];
        let searchIris = <string[]> data[1];
        let searchPaths = <string[]> data[2];
        let searchActivated = <boolean> data[3];
        if (!searchActivated) return tias;
        else return tias.filter(tia => searchIris.includes(tia.element.value) || searchPaths.includes(tia.element.value));
      })
    );
  }

  //search

  public getSearchMatch$(iri:string):Observable<SearchResultAttributes[]>{
    return this.searchPattern$.pipe(
      flatMap(searchPattern => this.searchtreeitemService.get(searchPattern).pipe(
        map(sras => sras.filter(sra => sra.element.value==iri))
      ))
    )
  }
  public getSearchPattern():string{
    let searchPattern;
    this.searchPattern$.subscribe(next => searchPattern = next);
    return searchPattern;
  }
  public isSearchMatch$(iri:string):Observable<boolean>{
    return this.searchIris$.pipe(
      map(searchIris => searchIris.includes(iri))
    )
  }
  public getSearchResultCount$():Observable<number>{
    return this.searchIris$.pipe(
      map(iris => iris.length)
    )
  }


  //external


  public addConceptInformation(cis$:Observable<ConceptInformation[]>){
    cis$.subscribe(cis => {
      this.conceptInformation$.next(cis);
      //this.claimWidth(800);
    });
  }
  public isInformationPathPart$(iri:string):Observable<boolean>{
    return this.informationPaths$.pipe(
      map(informationPaths => informationPaths.includes(iri))
    )
  }

  public setGhostTreeItems(items: TreeItemAttributes | TreeItemAttributes[]) {
    if (!(items instanceof Array)) items = [items];
    this.treeitemsService.setGhostTreeItems(items);
  }
}