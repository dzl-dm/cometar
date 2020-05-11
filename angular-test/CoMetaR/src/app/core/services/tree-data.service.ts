import { Injectable, ElementRef } from '@angular/core';
import { map, flatMap, filter, distinct, distinctUntilChanged, switchMap, startWith, last, first } from 'rxjs/operators';
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
import { ProgressService, Task } from 'src/app/services/progress.service';

@Injectable({
  providedIn: 'root'
})
export class TreeDataService {

  private route:ActivatedRoute;

  public selectedIri$:BehaviorSubject<string> = new BehaviorSubject("");
  /*private selectedPaths$:Observable<string[]>;
  private searchPaths$:Observable<string[]>;*/
  private searchPattern$:BehaviorSubject<string> = new BehaviorSubject("");
  private searchElements$:BehaviorSubject<string[]> = new BehaviorSubject([]);
  private informationPaths$:Observable<string[]>;
  public openedElements$:BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  public searchActivated$:Observable<boolean>;
  public reset$ = new Subject();
  public shownElements$:Observable<string[]>;

  private openElementsTask:Task;
  private allOpenedTreeItems$:Subject<string[]>=new BehaviorSubject<string[]>([]);

  private claimWidth=(number)=>{};

  constructor(
    private router: Router,
    private searchtreeitemService: SearchtreeitemService,
    private urlService: UrlService,
    private treeStyleService: TreeStyleService,
    private ontologyAccessService: OntologyAccessService,
    private progressService:ProgressService
  ) {
    this.searchActivated$ = this.searchPattern$.pipe(map(searchPattern => searchPattern != ""));
    this.treeItemConceptInformation$.subscribe(next => this.treeItemConceptInformationReplay$.next(next));
    //this.selectedIri$.subscribe(()=>this.openedElements$.next([]));
    /*this.selectedPaths$ = combineLatest(this.selectedIri$, this.openedElements$).pipe(
      flatMap(([iri,iris]) => this.ontologyAccessService.getAllAncestors(iris.concat(iri)))
    )*/
    this.searchPattern$.pipe(
      distinctUntilChanged(),
      flatMap(pattern => this.searchtreeitemService.get(pattern).pipe(
        map(searchResultAttributes => searchResultAttributes.map(e => e.element.value))
      ))
    ).subscribe(this.searchElements$)
    /*this.searchPaths$ = this.searchElements$.pipe(
      flatMap(iris => this.ontologyAccessService.getAllAncestors(iris))
    ) */
    this.informationPaths$ = this.treeItemConceptInformation$.pipe(
      flatMap(cis => this.ontologyAccessService.getAllAncestors(cis.map(ci => ci.concept)))
    ) 

    this.shownElements$ = this.openedElements$;//combineLatest(this.searchElements$,this.openedElements$).pipe(map(data => data[0].concat(data[1])))
    this.searchElements$.subscribe(data => {
      if (data.length == 1) this.onConceptSelection(data[0]);
      else this.ontologyAccessService.getAllAncestors(data).subscribe(iris => this.addShownElements(data.concat(iris))).unsubscribe();
    });
    this.selectedIri$.subscribe(data => {if (data != "") this.addShownElements([data])});
    
    let subtasks:number=0;
    /*this.allOpenedTreeItems$.subscribe(next => console.log("allOpenedTreeItems"));
    this.selectedIri$.subscribe(next => console.log("selectedIri"));
    this.searchIris$.subscribe(next => console.log("searchIris"));
    this.openedElements$.subscribe(next => console.log("openedElements"));
    this.treeStyleService.animatingElements$.subscribe(next => console.log("treeStyleService.animatingElements"));*/
    /*combineLatest(this.allOpenedTreeItems$,this.selectedIri$,this.searchElements$,this.openedElements$,this.treeStyleService.animatingElements$)*/
    combineLatest(this.allOpenedTreeItems$,this.shownElements$).subscribe(data=>{
      let taskrunning = this.openElementsTask && this.openElementsTask.status=="running";
      let animationsrunning = false;//data[4]>0;
      let openedIris=data[0];
      //let selectedIri = data[1]!=""?[data[1]]:[];
      //fails if selectedIri is not shown anymore (e.g. cause higher node is collapsed)
      //let requiredIris:string[] = selectedIri.concat(data[2]).concat(data[3]); 
      let requiredIris:string[] = data[1];//data[2].concat(data[3]); 
      let missingIris = requiredIris.filter(iri => !openedIris.includes(iri));
      let allRequiredIrisOpened = missingIris.length==0 && !animationsrunning;
      //console.log("missing: "+missingIris.length + " animating: "+data[4]);
      if (taskrunning) this.openElementsTask.update(requiredIris.length-(missingIris.length/*+data[4]*/),requiredIris.length);
      if (taskrunning && allRequiredIrisOpened) this.openElementsTask.finish();
      else if (!taskrunning && !allRequiredIrisOpened){
        subtasks=missingIris.length;//+data[4];
        this.openElementsTask = this.progressService.addTreeTask("Opening elements",subtasks);
      }
    });
  }

  public reset(){
    this.allTreeItemConceptInformation$.next([]);
    this.openedElements$.next([]);
    this.reset$.next();
  }

  public treeItemViewCreated(iri:string){
    this.allOpenedTreeItems$.next(this.treeStyleService.getAllOpenedTreeItems());
  }

  //init (through tree component)
  public init(route:ActivatedRoute, claimWidth:(number)=>void){
    route.queryParamMap.pipe(
      map(data => this.urlService.extendRdfPrefix(data.get('concept')))
    ).subscribe(this.selectedIri$);
    route.queryParamMap.pipe(
      map(data => data.get('searchpattern') ? data.get('searchpattern') : "")
    ).subscribe(pattern => {
      this.searchPattern$.next(pattern);
    });
    this.claimWidth=claimWidth;
    route.queryParamMap.subscribe(()=>{
      setTimeout(()=>this.treeStyleService.onTreeDomChange("Query Parameter changed."),0);
    })
  }

  //selection
  public onConceptSelection(iri:string):void{
    this.onExpand(iri);
    this.router.navigate(["details"],{ queryParams: {concept: this.urlService.shortenRdfPrefix(iri)}, queryParamsHandling: "merge" });
  }
  public isSelected$(iri:string):Observable<boolean>{
    return this.selectedIri$.pipe(
      map(selectedIri => selectedIri == iri)
    )
  }
  public onExpand(iri:string):void{
    /*let children;
    this.ontologyAccessService.getFirstLevelChildren([iri]).subscribe(data => children = data);
    this.addShownElements(children);*/
  }
  public onCollapse(iri:string):void{
    let children;
    this.ontologyAccessService.getAllChildren([iri]).subscribe(data => children = data);
    this.removeShownElements(children);
  }
  public addShownElements(iris:string[]):void{
    this.openedElements$.next(this.openedElements$.getValue().concat(iris).filter((value, index, array)=>array.indexOf(value)===index));
  }
  public removeShownElements(iris:string[]):void{
    this.openedElements$.next(this.openedElements$.getValue().filter(oe => !iris.includes(oe))) 
    //this.searchElements$.next(this.searchElements$.getValue().filter(se => !iris.includes(se)))     
  }

  //item offering
  /*public getTopLevelItems$():Observable<TreeItem[]>{
    return this.searchItemFilter(this.ontologyAccessService.getTopLevelItems$());
  }
  public getSubItems$(iri:string):Observable<TreeItem[]>{
    return this.searchItemFilter(this.ontologyAccessService.getSubItems$(iri));
  }*/
  /*public isSelectedPathPart$(iri:string):Observable<boolean>{
    return this.selectedPaths$.pipe(
      map(selectedPaths => selectedPaths.includes(iri))
    )
  }*/
  /*public isSearchPathPart$(iri:string):Observable<boolean>{
    return this.searchPaths$.pipe(
      map(searchPaths => searchPaths.includes(iri))
    )
  }*/
  /*public isAnyPathPart$(iri:string):Observable<boolean>{
    return combineLatest(this.isSelectedPathPart$(iri), this.isSearchPathPart$(iri)/*, this.isInformationPathPart$(iri)*//*).pipe(
      map(data => data.includes(true))
    )
  }*/
  /*private searchItemFilter(o:Observable<TreeItem[]>):Observable<TreeItem[]>{
    return combineLatest(o, this.searchElements$, this.searchPaths$, this.searchActivated$).pipe(
      map(data => {
        let tias = <TreeItem[]> data[0];
        let searchIris = <string[]> data[1];
        let searchPaths = <string[]> data[2];
        let searchActivated = <boolean> data[3];
        if (!searchActivated) return tias;
        else return tias.filter(tia => searchIris.includes(tia.element.value) || searchPaths.includes(tia.element.value));
      })
    );
  }*/

  //search

  public getSearchMatch$(iri:string):Observable<SearchResultAttributes[]>{
    return this.searchPattern$.pipe(
      flatMap(searchPattern => this.searchtreeitemService.get(searchPattern).pipe(
        map(sras => sras.filter(sra => sra.element.value==iri))
      ))
    )
  }
  public getSearchPattern():string{
    return this.searchPattern$.getValue();
  }
  public isSearchMatch$(iri:string):Observable<boolean>{
    return this.searchElements$.pipe(
      map(searchIris => searchIris.includes(iri))
    )
  }
  public getSearchResultCount$():Observable<number>{
    return this.searchElements$.pipe(
      map(iris => iris.length)
    )
  }


  //external

  private allTreeItemConceptInformation$:BehaviorSubject<Observable<ConceptInformation[]>[]> = new BehaviorSubject<Observable<ConceptInformation[]>[]>([]);
  private treeItemConceptInformation$:Observable<ConceptInformation[]> = this.allTreeItemConceptInformation$.pipe(flatMap(styles => combineLatest(styles).pipe(
    map(s => s.reduce((result,next)=>result=result.concat(next),[]))
  )));
  private treeItemConceptInformationReplay$ = new ReplaySubject<ConceptInformation[]>(1);
  public addTreeItemConceptInformation(cis$:Observable<ConceptInformation[]>){
    let s:Observable<ConceptInformation[]>[] = this.allTreeItemConceptInformation$.getValue();
    this.allTreeItemConceptInformation$.next(s.concat(cis$.pipe(startWith([]))));
  }
  public getTreeItemConceptInformation(iri:string):Observable<ConceptInformation[]>{
    return this.treeItemConceptInformationReplay$.pipe(map(cis => cis.filter(ci => ci.concept==iri)))
  }


  public isInformationPathPart$(iri:string):Observable<boolean>{
    return this.informationPaths$.pipe(
      map(informationPaths => informationPaths.includes(iri))
    )
  }
}