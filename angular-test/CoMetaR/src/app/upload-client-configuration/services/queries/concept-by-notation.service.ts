import { Injectable } from '@angular/core';
import { DataService, prefixes } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ConceptByNotationService {

  constructor(private dataService: DataService) { }

  /**
   * 
   * @param {string[]} iris
   */
  public get(notation:string):Observable<string> { 
    const queryString = this.getQueryString(notation);
    return this.dataService.getData(queryString).pipe(map(data=> data[0] && data[0].concept.value || ""))
  };

  private getQueryString(notation:string):string {
      return `
      ${prefixes}
      SELECT DISTINCT ?concept
      WHERE
      {
          ?concept skos:notation "${notation}".
      }`;
  }
}