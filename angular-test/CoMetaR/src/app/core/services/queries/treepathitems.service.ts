import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../../../services/data.service';
import { Observable } from 'rxjs';
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
    const queryString = this.getQueryString(iris);
    return this.dataService.getData(queryString).pipe(map(
        (data)=>data.map(e=> e.treePathItem.value)
    ))
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
