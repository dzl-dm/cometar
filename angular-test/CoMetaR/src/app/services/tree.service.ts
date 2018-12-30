import { Injectable } from '@angular/core';
import { TreepathitemsService } from './queries/treepathitems.service';
import { ActivatedRoute } from '@angular/router';
import { ConfigurationService } from './configuration.service';
import { map, flatMap, filter } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable, ReplaySubject, combineLatest } from 'rxjs';
import { SearchtreeitemService, SearchResultAttributes } from './queries/searchtreeitem.service';
import { TreeItemsService, TreeItemAttributes } from './queries/treeitems.service';


@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private route:ActivatedRoute;

  private selectedIri$:ReplaySubject<string>;
  private selectedPaths$:Observable<string[]>;
  private searchPaths$:Observable<string[]>;
  private searchPattern$:ReplaySubject<string>;
  private searchIris$:Observable<string[]>;
  private maxInformationDivWidth;

  constructor(
    private treeitemsService: TreeItemsService, 
    private treepathitemsService: TreepathitemsService, 
    private configuration: ConfigurationService,
    private router: Router,
    private searchtreeitemService: SearchtreeitemService
  ) {
    this.selectedIri$ = new ReplaySubject(1);
    this.searchPattern$ = new ReplaySubject(1);
    this.selectedPaths$ = this.selectedIri$.pipe(
      flatMap(iri => this.treepathitemsService.get([iri]))
    )
    this.searchIris$ = this.searchPattern$.pipe(
      flatMap(iri => this.searchtreeitemService.get(iri).pipe(
        map(searchResultAttributes => searchResultAttributes.map(e => e.element.value))
      ))
    )
    this.searchPaths$ = this.searchIris$.pipe(
      flatMap(iris => this.treepathitemsService.get(iris))
    )
  }

  //init (through tree component)
  public setRoute(route:ActivatedRoute){
    route.paramMap.pipe(
      map(data => this.extendRdfPrefix(data.get('prefix')+data.get('concept')))
    ).subscribe(this.selectedIri$);

    route.queryParamMap.pipe(
      map(data => data.get('searchpattern') ? data.get('searchpattern') : "")
    ).subscribe(this.searchPattern$);
  }

  //selection
  public onConceptSelection(iri:string):void{
    let queryParams = {};
    if (this.getSearchPattern()) queryParams["searchpattern"] = this.getSearchPattern();
    this.router.navigate([this.shortenRdfPrefix(iri)],{queryParams: queryParams, relativeTo: this.route});
  }
  public isSelected$(iri:string):Observable<boolean>{
    return this.selectedIri$.pipe(
      map(selectedIri => selectedIri == iri)
    )
  }
  private shortenRdfPrefix(s:string):string{
    Object.entries(this.configuration.getRdfPrefixMap()).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value + "/")
    });
    return s;
  }
  private extendRdfPrefix(s:string):string{
    if (!s) return "";
    Object.entries(this.configuration.getRdfPrefixMap()).forEach(
      ([value, key]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });
    return s;
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
    return combineLatest(this.isSelectedPathPart$(iri), this.isSearchPathPart$(iri)).pipe(
      map(data => data.includes(true))
    )
  }
  private searchItemFilter(o:Observable<TreeItemAttributes[]>):Observable<TreeItemAttributes[]>{
    return combineLatest(o, this.searchIris$, this.searchPaths$, this.searchActivated$()).pipe(
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
  public searchActivated$():Observable<boolean>{
    return this.searchPattern$.pipe(
      map(searchPattern => searchPattern != "")
    )
  }
  public getSearchMatch$(iri:string):Observable<SearchResultAttributes>{
    return this.searchPattern$.pipe(
      flatMap(searchPattern => this.searchtreeitemService.get(searchPattern).pipe(
        map(sras => sras.filter(sra => sra.element.value==iri)[0]),
        filter(sra => sra != undefined)
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

  //appearance
  public updateInformationDivWidth(width:number){
    if (!this.maxInformationDivWidth) this.maxInformationDivWidth = width;
    else this.maxInformationDivWidth = Math.min(this.maxInformationDivWidth,width);
  }
  public getInformationDivWidth():number{
    return this.maxInformationDivWidth;
  }
}