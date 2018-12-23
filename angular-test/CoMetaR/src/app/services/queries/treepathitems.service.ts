import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreepathitemsService {
  constructor(private dataService: DataService) { }

  private results = {};
  /**
   * 
   * @param {string[]} iris
   */
  public get(iris:string[]):string[] { 
    if (!this.results[iris.join(';')]){
        this.results[iris.join(';')] = [];
        const queryString = this.getQueryString(iris);
        this.dataService.getData(queryString).pipe(map(
            (data)=>data.map((e)=>e.treePathItem.value)
        )).subscribe(data => {
            this.results[iris.join(';')]=data;
        });
    }
    return this.results[iris.join(';')];
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
