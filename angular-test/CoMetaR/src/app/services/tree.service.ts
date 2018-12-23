import { Injectable } from '@angular/core';
import { TreepathitemsService } from './queries/treepathitems.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { ConfigurationService } from './configuration.service';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SearchtreeitemService, SearchResultAttributes } from './queries/searchtreeitem.service';
import { TreeItemsService, TreeItemAttributes } from './queries/treeitems.service';


@Injectable({
  providedIn: 'root'
})
export class TreeService {
  private route:ActivatedRoute;

  private selectedIri:string = "";
  private searchPattern:string = "";
  private maxInformationDivWidth;

  constructor(
    private treeitemsService: TreeItemsService, 
    private treepathitemsService: TreepathitemsService, 
    private configuration: ConfigurationService,
    private router: Router,
    private searchtreeitemService: SearchtreeitemService
  ) {

  }

  //routing
  private updateTreeState():void{
    this.route.queryParamMap.subscribe(data => {
      let searchPattern = data.get('searchpattern') ? data.get('searchpattern') : "";      
      this.searchPattern = searchPattern;
    });
    this.route.paramMap.pipe(map(data => this.extendRdfPrefix(data.get('prefix')+data.get('concept'))))
      .subscribe(selectedIri => {
        this.selectedIri = selectedIri;
      });
  }
  public getSelectedPaths():string[]{
    return this.treepathitemsService.get([this.selectedIri]);
  }
  public setRoute(route:ActivatedRoute){
    this.route=route;
    this.updateTreeState();
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
  public getTopLevelItems():Observable<TreeItemAttributes[]>{
    return this.treeItemPipe(this.treeitemsService.get({range:"top"}));
  }
  public getSubItems(iri):Observable<TreeItemAttributes[]>{
    return this.treeItemPipe(this.treeitemsService.get({range:"sub",iri:iri}));
  }
  private treeItemPipe(o:Observable<TreeItemAttributes[]>):Observable<TreeItemAttributes[]>{
    return o.pipe(
      map(data => data.filter(treeItemAttribute => {
        let showTreeItemAttribute = !this.searchActivated() 
        || this.isSearchMatch(treeItemAttribute.element.value)
        || this.getSearchPaths().length == 0
        || this.getSearchPaths().includes(treeItemAttribute.element.value);
        return showTreeItemAttribute;
      }))
    );
  }
  public isTreePathPart(iri):boolean{
    return this.getSelectedPaths().includes(iri) || this.getSearchPaths().includes(iri)
  }

  //search
  public getSearchPaths():string[]{
    return this.treepathitemsService.get(this.searchtreeitemService.get(this.searchPattern).map(data => data.element.value));
  }
  public getSearchPattern():string{
    return this.searchPattern;
  }
  public searchActivated():boolean{return this.searchPattern != ""}
  public isSearchMatch(iri:string):boolean{
    if (this.searchtreeitemService.get(this.searchPattern).map(data => data.element.value).includes(iri)) return true;
    return false;
  }
  public getSearchMatch(iri:string):SearchResultAttributes{
    return this.searchtreeitemService.get(this.searchPattern).filter(data => data.element.value==iri)[0];
  }
  public getSearchResultCount():number{
    return this.searchtreeitemService.get(this.searchPattern).length;
  }

  //selection
  public onConceptSelection(iri:string):void{
    this.router.navigate([this.shortenRdfPrefix(iri)]);
  }
  public isSelected(iri:string):boolean{
    return this.selectedIri == iri;
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

export interface TreeState {
  searchPattern:string,
  selectedPaths:string[],
  searchPaths:string[],
  selectedIri:string
}