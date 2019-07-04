import { Injectable, ElementRef } from '@angular/core';
import { map, flatMap, filter, distinct, distinctUntilChanged, switchMap, startWith } from 'rxjs/operators';
import { Observable, combineLatest, ReplaySubject, BehaviorSubject, Subject } from 'rxjs';
import { SearchResultAttributes, SearchtreeitemService } from './queries/searchtreeitem.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UrlService } from '../../services/url.service'
import { Component } from '@angular/compiler/src/core';
import { ConceptInformation } from '../concept-information/concept-information.component';
import { TreeStyleService } from './tree-style.service';
import { OntologyDataService } from './ontology-data.service';
import { OntologyAccessService } from './ontology-access.service';
import { TreeItem } from '../classes/tree-item';

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
  public reset$ = new Subject();

  private claimWidth=(number)=>{};

  constructor(
    private router: Router,
    private searchtreeitemService: SearchtreeitemService,
    private urlService: UrlService,
    private treeStyleService: TreeStyleService,
    private ontologyAccessService: OntologyAccessService
  ) {
    this.selectedIri$ = new ReplaySubject(1);
    this.searchPattern$ = new ReplaySubject(1);
    this.searchActivated$ = this.searchPattern$.pipe(map(searchPattern => searchPattern != ""));
    //this.selectedIri$.subscribe(()=>this.openedElements$.next([]));
    this.selectedPaths$ = combineLatest(this.selectedIri$, this.openedElements$).pipe(
      flatMap(([iri,iris]) => this.ontologyAccessService.getAllAncestors(iris.concat(iri)))
    )
    this.searchIris$ = this.searchPattern$.pipe(
      distinctUntilChanged(),
      flatMap(pattern => this.searchtreeitemService.get(pattern).pipe(
        map(searchResultAttributes => searchResultAttributes.map(e => e.element.value))
      ))
    )
    this.searchPaths$ = this.searchIris$.pipe(
      flatMap(iris => this.ontologyAccessService.getAllAncestors(iris))
    ) 
    this.informationPaths$ = this.treeItemConceptInformation$.pipe(
      flatMap(cis => this.ontologyAccessService.getAllAncestors(cis.map(ci => ci.concept)))
    )   
  }

  public reset(){
    this.allTreeItemConceptInformation$.next([]);
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
      setTimeout(()=>this.treeStyleService.onTreeDomChange("Query Parameter changed."),0);
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
  public getTopLevelItems$():Observable<TreeItem[]>{
    return this.searchItemFilter(this.ontologyAccessService.getTopLevelItems$());
  }
  public getSubItems$(iri:string):Observable<TreeItem[]>{
    return this.searchItemFilter(this.ontologyAccessService.getSubItems$(iri));
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
  private searchItemFilter(o:Observable<TreeItem[]>):Observable<TreeItem[]>{
    return combineLatest(o, this.searchIris$, this.searchPaths$, this.searchActivated$).pipe(
      map(data => {
        let tias = <TreeItem[]> data[0];
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

  private allTreeItemConceptInformation$:BehaviorSubject<Observable<ConceptInformation[]>[]> = new BehaviorSubject<Observable<ConceptInformation[]>[]>([]);
  private treeItemConceptInformation$:Observable<ConceptInformation[]> = this.allTreeItemConceptInformation$.pipe(flatMap(styles => combineLatest(styles).pipe(
    map(s => s.reduce((result,next)=>result=result.concat(next),[]))
  )));
  public addTreeItemConceptInformation(cis$:Observable<ConceptInformation[]>){
    let s:Observable<ConceptInformation[]>[];
    this.allTreeItemConceptInformation$.subscribe(d => s = d).unsubscribe();
    this.allTreeItemConceptInformation$.next(s.concat(cis$.pipe(startWith([]))));
  }
  public getTreeItemConceptInformation(iri:string):Observable<ConceptInformation[]>{
    return this.treeItemConceptInformation$.pipe(map(cis => cis.filter(ci => ci.concept==iri)))
  }


  public isInformationPathPart$(iri:string):Observable<boolean>{
    return this.informationPaths$.pipe(
      map(informationPaths => informationPaths.includes(iri))
    )
  }
}