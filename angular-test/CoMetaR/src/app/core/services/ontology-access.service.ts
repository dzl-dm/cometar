import { Injectable } from '@angular/core';
import { OntologyDataService } from './ontology-data.service';
import { TreeItem } from '../classes/tree-item';
import { Observable, of } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { JSONResponsePartUriString, JSONResponsePartString } from 'src/app/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class OntologyAccessService {

  constructor(
    private ontologyDataService:OntologyDataService
  ) { 
  }

  public getTopLevelItems$():Observable<TreeItem[]>{
    return this.ontologyDataService.rootItems$;
  }
  public getSubItems$(iri:string):Observable<TreeItem[]>{
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => tis.filter(ti => ti.element.value == iri)[0].children)
    )
  }
  public getItem$(iri:string):Observable<TreeItem>{
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => tis.filter(ti => ti.element.value == iri)[0])
    )    
  }
  public getAllAncestors(iris:string[]):Observable<string[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        let ancestors = [];
        tis.filter(ti => iris.includes(ti.element.value)).forEach(ti => {
          this.fillAllItemAncestors(ancestors,ti);
        })
        return ancestors;
      })
    )
  }
  public getAllChildren(iris:string[]):Observable<string[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        let children = [];
        tis.filter(ti => iris.includes(ti.element.value)).forEach(ti => {
          children.push(this.getAllItemChildren(ti))
        })
        return children.reduce((result:string[],next:string[])=>result = result.concat(next),[]);
      })
    )
  }
  private fillAllItemAncestors(ancestors:string[],ti:TreeItem){
    ti.parents.forEach(p => {
      if (!ancestors.includes(p.element.value)){
        ancestors.push(p.element.value);
        this.fillAllItemAncestors(ancestors,p);
      }
    })
  }
  private getAllItemChildren(ti:TreeItem,children:string[]=[]):string[]{
    ti.children.forEach(c => {
      children.push(c.element.value);
      this.getAllItemChildren(c,children);
    })
    return children;
  }
    
  public setGhostTreeItems(gtis: GhostTreeItem[]) {
    this.ontologyDataService.setGhostTreeItems(gtis);
  }

  public getAllTreeItems():Observable<TreeItem[]>{
    return this.ontologyDataService.treeItems$
  }

  public getTreeItem$(iri:string):Observable<TreeItem>{
    return this.ontologyDataService.treeItems$.pipe(map(tis => {
      let match = tis.filter(ti => ti.element.value==iri);
      return match.length > 0 && match[0] || undefined;
    }))
  }
}

export interface GhostTreeItem {
  element:JSONResponsePartUriString,
  label:JSONResponsePartString,
  parent:string
}
