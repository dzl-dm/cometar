import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { DataService, prefixes, JSONResponsePartString, JSONResponsePartNumber, JSONResponsePartUriString } from 'src/app/services/data.service';

@Injectable({
  providedIn: 'root'
})
export class SearchSuggestionService {

  constructor(private dataService: DataService) { }
  public get(pattern:string):Observable<SearchSuggestion[]> { 
    if (pattern == "") return of([]);
    pattern = pattern.replace(/([\\'"])/g,"\\$1").replace(/([{}()])/g,"\\\\$1");
    const queryString = this.getQueryString(pattern);
    return this.dataService.getData(queryString,"search for pattern "+pattern);
  };
  public getQueryString(pattern:string):string {
    return `#search suggestions...
${prefixes}
SELECT ?match (count(?match) as ?count) ?weight
WHERE { 
  ?element rdf:type ?t .
  FILTER (?t IN (skos:Concept, skos:Collection)) .
  ?element ?property ?value FILTER (regex(?value, '${pattern}', 'i') && ?property !=dc:creator) .
  BIND(str(lcase(replace(?value,'(^|.* )([a-zA-Z0-9äöüß._:()/=,-]*${pattern}([a-zA-Z0-9äöüß._:()/=,-]*[a-zA-Z0-9äöüß()])?( [a-zA-Z0-9äöüß._:()/=,-]*[a-zA-Z0-9äöüß()]){0,2}).*', '$2', 'is'))) as ?match) .
  BIND(IF(STRSTARTS( ?match, "${pattern}" ) && !regex($match,' '), 100,0) as ?weight) .
}
group by ?match ?weight
order by desc(?weight) desc(count(?match))
limit 10`;
  }
}

export interface SearchSuggestion {
  match:JSONResponsePartString,
  count:JSONResponsePartNumber
}