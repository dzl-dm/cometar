import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../../../services/data.service';
import { Observable, combineLatest, of, ReplaySubject } from 'rxjs';
import { map, concat, flatMap } from 'rxjs/operators';
import { TreeItemsService } from './treeitems.service';

@Injectable({
  providedIn: 'root'
})
export class TreepathitemsService {
  constructor(private dataService: DataService, private treeItemsService:TreeItemsService) {
    combineLatest(
      this.treeItemsService.removedTreeItems$,
      this.treeItemsService.movedTreeItems$)
    .pipe(map(removesandmoves => removesandmoves[0].concat(removesandmoves[1]))).subscribe(rms => {
      rms.forEach(rm=> {
        this.ghostiris[rm.element]=this.ghostiris[rm.element]||[];
        let op:string[] = [rm.oldparent];
        do {
          this.ghostiris[rm.element]=this.ghostiris[rm.element].concat(op);
          op = rms.filter(rm2 => op.includes(rm2.element)).map(rm2 => rm2.oldparent)
        } while (op.length > 0)
      });
      this.ghostiris$.next(this.ghostiris);
    });
  }

  private ghostiris = {};
  private ghostiris$ = new ReplaySubject<{}>(1);
  
  public get(iris:string[], includeIriInPath:boolean=false):Observable<string[]> {
    return this.ghostiris$.pipe(flatMap(ghostiris => {
    
      let obs:Observable<string[]>[]=[];
      
      let tempGhostiris = [];
      iris.forEach(iri => tempGhostiris = tempGhostiris.concat(ghostiris[iri]||[]));
      let iriswithghostiris = iris.concat(tempGhostiris);
  
      let pos = 0;
      let packsize = 5;
      while (iriswithghostiris.length >= pos){
        let tempiris = iriswithghostiris.slice(pos,pos+packsize);
        let queryString = this.getQueryString(tempiris,includeIriInPath);
        obs.push(this.dataService.getData(queryString).pipe(map(
          (data)=>data.map(e=> e.treePathItem.value)
        )));
        pos+=packsize;
      }
      let pathiris = obs.length > 0 && combineLatest(obs).pipe(map(observables => {
        let result:string[] = [];
        for (let o of observables) {
          result = result.concat(o);
        }
        return result;
      })) || of([""]);    
      pathiris = pathiris.pipe(map(iris => iris.concat(tempGhostiris)));
      return pathiris;
      
    }))
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
}
