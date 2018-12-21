import { Injectable } from '@angular/core';
import { TreepathitemsService } from '../services/queries/treepathitems.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ConfigurationService } from './configuration.service';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { SearchService } from './search.service';


@Injectable({
  providedIn: 'root'
})
export class TreestateService {
  private route:ActivatedRoute;

  private treeState: TreeState = {
    searchPattern: "",
    selectedPaths: [],
    searchPaths: [],
    selectedIri: ""
  };

  constructor(
    private treepathitemsService: TreepathitemsService, 
    private configuration: ConfigurationService,
    private router: Router,
    private searchService: SearchService
  ) {
    this.searchService.searchResultAttributes$.subscribe((data) => {
      this.treepathitemsService.get(data.map(e=>e.element.value)).subscribe((e)=>{
        this.treeState.searchPaths=e
      });
    });
  }

  private updateTreeState():void{
    this.route.paramMap.pipe(map(data => this.extendRdfPrefix(data.get('prefix')+data.get('concept'))))
      .subscribe(selectedIri => {
        this.treeState.selectedIri = selectedIri;
        this.treepathitemsService.get([selectedIri]).pipe(map(data => {
          this.treeState.selectedPaths = data
        })).subscribe();
      });
  }

  public setRoute(route:ActivatedRoute){
    this.route=route;
    this.updateTreeState();
  }

  public setSearchPattern(s:string){
    this.searchService.searchPattern$.next(s);
    this.treeState.searchPattern = s;
  }

  public getState():TreeState{
    return this.treeState;
  }

  public isTreePathPart(iri:string):boolean{
    return this.treeState.selectedPaths.includes(iri) || this.treeState.searchPaths.includes(iri);
  }

  public searchActivated():boolean{return this.treeState.searchPattern != ""}

  public onConceptSelection(iri:string):void{
    this.router.navigate([this.shortenRdfPrefix(iri)]);
  }

  public isSelected(iri:string):boolean{
    return this.treeState.selectedIri == iri;
  }

  public isSearchMatch(iri:string):boolean{
    if (this.searchService.getSearchPathItems().includes(iri)) return true;
    return false;
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
}

export interface TreeState {
  searchPattern:string,
  selectedPaths:string[],
  searchPaths:string[],
  selectedIri:string
}