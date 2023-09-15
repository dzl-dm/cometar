import { Injectable } from '@angular/core';
import { OntologyDataService } from './ontology-data.service';
import { TreeItem } from '../classes/tree-item';
import { Observable } from 'rxjs';
import { JSONResponsePartUriString, JSONResponsePartString } from 'src/app/services/data.service';
import { map } from 'rxjs/operators';

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
  public getSubItems$(iri:string):Observable<TreeItem[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        const item = tis.filter(ti => ti.element.value === iri);
        if (item && item.length > 0) { return item[0].children; }
        return [];
      })
    );
  }
  public getAllAncestors(iris:string[]):Observable<string[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        const ancestors = [];
        tis.filter(ti => iris.includes(ti.element.value)).forEach(ti => {
          this.fillAllItemAncestors(ancestors,ti);
        });
        return ancestors;
      })
    );
  }
  public getAllChildren(iris:string[]):Observable<string[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        const children = [];
        tis.filter(ti => iris.includes(ti.element.value)).forEach(ti => {
          children.push(this.getAllItemChildren(ti));
        });
        return children.reduce((result:string[],next:string[])=>result = result.concat(next),[]);
      })
    );
  }
  public getFirstLevelChildren(iris:string[]):Observable<string[]> {
    return this.ontologyDataService.treeItems$.pipe(
      map(tis => {
        const children = [];
        tis.filter(ti => iris.includes(ti.element.value)).forEach(ti => {
          children.push(ti.children.map(c => c.element.value));
        });
        return children.reduce((result:string[],next:string[])=>result = result.concat(next),[]);
      })
    );
  }
  private fillAllItemAncestors(ancestors:string[],ti:TreeItem){
    ti.parents.forEach(p => {
      if (!ancestors.includes(p.element.value)){
        ancestors.push(p.element.value);
        this.fillAllItemAncestors(ancestors,p);
      }
    });
  }
  private getAllItemChildren(ti:TreeItem,children:string[]=[]):string[]{
    ti.children.forEach(c => {
      children.push(c.element.value);
      this.getAllItemChildren(c,children);
    });
    return children;
  }
    
  public setGhostTreeItems(gtis: GhostTreeItem[]) {
    this.ontologyDataService.setGhostTreeItems(gtis);
  }

  public getAllTreeItems():Observable<TreeItem[]>{
    return this.ontologyDataService.treeItems$;
  }

  public getTreeItem$(iri:string):Observable<TreeItem>{
    return this.ontologyDataService.treeItems$.pipe(map(tis => {
      const match = tis.filter(ti => ti.element.value==iri);
      return match.length > 0 && match[0] || undefined;
    }));
  }
}

export interface GhostTreeItem {
  element:JSONResponsePartUriString;
  label:JSONResponsePartString;
  parent:string;
}
