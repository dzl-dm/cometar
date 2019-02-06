import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../../../services/data.service';
import { Observable, combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreepathitemsService {
  constructor(private dataService: DataService) { }

  /**
   * 
   * @param {string[]} iris
   */
  public get(iris:string[]):Observable<string[]> { 
    let obs:Observable<string[]>[]=[];
    while (iris.length > 0){
      let tempiris = iris.splice(0,25);
      const queryString = this.getQueryString(tempiris);
      obs.push(this.dataService.getData(queryString).pipe(map(
        (data)=>data.map(e=> e.treePathItem.value)
      )));
    }
    return obs.length > 0 && combineLatest(obs).pipe(map(observables => {
      let result:string[] = [];
      for (let o of observables) {
        result = result.concat(o);
      }
      return result;
    })) || of([""]);
  };

  private getQueryString(iris:string[]):string {
      return `
      ${prefixes}
      SELECT DISTINCT ?treePathItem
      WHERE
      {
          ?element skos:broader* [ rdf:partOf* [ skos:broader* ?c ] ] .
          ?treePathItem skos:member* ?c .
          ?treePathItem rdf:type ?type FILTER (?type IN (skos:Concept, skos:Collection)) .
          filter (?treePathItem != ?element && ?element IN (${iris.map(e => `<${e}>`).join(',')}))
      }`;
  }
}
