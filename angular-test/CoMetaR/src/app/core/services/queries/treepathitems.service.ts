import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../../../services/data.service';
import { Observable, combineLatest, of, ReplaySubject, Subject, BehaviorSubject } from 'rxjs';
import { map, concat, flatMap, withLatestFrom } from 'rxjs/operators';
import { TreeItemsService, TreeItemAttributes } from './treeitems.service';

@Injectable({
  providedIn: 'root'
})
export class TreepathitemsService {
  constructor(private dataService: DataService, private treeItemsService:TreeItemsService) {
    this.treeItemsService.ghostTreeItems$.subscribe(items => {
      let pathsChildToParent={};
      let pathsParentToChild={};
      items.forEach(item => this.addPath(pathsChildToParent,item.ghostItemParent,item.element.value));
      items.forEach(item => this.addPath(pathsParentToChild,item.element.value,item.ghostItemParent));
      this.ghostPathsChildToParent$.next(pathsChildToParent);
      this.ghostPathsParentToChild$.next(pathsParentToChild);
    });
    let queryString = this.getAllParentRelationsQueryString();
    this.dataService.getData(queryString).subscribe(data => {
      let pathsChildToParent={};
      let pathsParentToChild={};
      data.forEach(pc => this.addPath(pathsChildToParent,pc["parent"].value,pc["child"].value));
      data.forEach(pc => this.addPath(pathsParentToChild,pc["child"].value,pc["parent"].value));
      this.pathsChildToParent$.next(pathsChildToParent);
      this.pathsParentToChild$.next(pathsParentToChild);
    });
  }

  private addPath(paths,a,b){
    let childpath = paths[b] || {};
    let parentpath = paths[a] || {};
    childpath[a]=parentpath;
    paths[b] = childpath;
    paths[a] = parentpath;
  }

  private pathsChildToParent$ = new BehaviorSubject<{}>({});
  private pathsParentToChild$ = new BehaviorSubject<{}>({});

  public ghostPathsChildToParent$ = new BehaviorSubject<{}>({});
  public ghostPathsParentToChild$ = new BehaviorSubject<{}>({});

  private getPaths(paths:{},iris:string[],newiris?:string[]):string[]{
    if (newiris && newiris.length == 0) return iris;
    return this.getPaths(paths, 
      iris.concat(newiris || []),
      (newiris || iris).map(iri => paths[iri] && <string[]>Object.keys(paths[iri]) || []).reduce((result,next)=>result=result.concat(next),[]));
  }
  
  public hasChildren(iri:string):Observable<boolean> {
    return combineLatest(this.pathsParentToChild$,this.ghostPathsParentToChild$).pipe(map(data => {
      return (data[0][iri] && Object.keys(data[0][iri]).length > 0 || data[1][iri] && Object.keys(data[1][iri]).length > 0)
    }));
  }
  public getAllChildren(iris:string[], includeIrisInPath:boolean=false):Observable<string[]> {
    if (iris.length == 0) return of([]);
    return combineLatest(this.pathsParentToChild$,this.ghostPathsParentToChild$).pipe(map(data => {
      let ps = this.getPaths(data[0],iris).filter((value,index,self)=>self.indexOf(value) === index);
      let gp = this.getPaths(data[1],iris.concat(ps)).filter((value,index,self)=>self.indexOf(value) === index);
      if (!includeIrisInPath) gp = gp.filter(p => !iris.includes(p));
      return gp;
    }));
  }
  public getAllAncestors(iris:string[], includeIrisInPath:boolean=false):Observable<string[]> {
    if (iris.length == 0) return of([]);
    return combineLatest(this.pathsChildToParent$,this.ghostPathsChildToParent$).pipe(map(data => {
      let gp = this.getPaths(data[1],iris);
      gp = gp.filter(p => !iris.includes(p));
      let ps = this.getPaths(data[0],iris.concat(gp));
      if (!includeIrisInPath) ps = ps.filter(p => !iris.includes(p));
      return ps;
    }));
  };

  public getQueryString(iris:string[], includeIriInPath:boolean=false):string {
      return `${prefixes}
SELECT DISTINCT ?treePathItem
WHERE
{
    ?element skos:broader* [ rdf:partOf* [ skos:broader* ?c ] ] .
    ?treePathItem skos:member* ?c .
    ?treePathItem rdf:type ?type FILTER (?type IN (skos:Concept, skos:Collection)) .
    filter (${includeIriInPath?'':'?treePathItem != ?element && '}?element IN (${iris.map(e => `<${e}>`).join(',')}))
}
      `;
  }

  public getAllParentRelationsQueryString():string {
    return `${prefixes}
SELECT ?parent ?child
WHERE
{
  ?parent ?narrower ?child .
  FILTER (?narrower IN (skos:narrower, skos:member, rdf:hasPart))
}`
  }
}
