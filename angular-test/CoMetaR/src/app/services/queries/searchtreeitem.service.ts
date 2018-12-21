import { Injectable } from '@angular/core';
import { DataService, prefixes } from '../data.service';
import { Observable } from 'rxjs';
import { JSONResponsePartLangString, JSONResponsePartUriString, JSONResponsePartBoolean, JSONResponsePartString } from '../data.service';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SearchtreeitemService {

  constructor(private dataService: DataService) { }

  public get(pattern:string):Observable<SearchResultAttributes[]> { 
    const queryString = this.getQueryString(pattern);
    return this.dataService.getData(queryString).pipe(map(data=><SearchResultAttributes[]> data))
  };

  private getQueryString(pattern:string):string {
      return `
      ${prefixes}
      SELECT DISTINCT ?element ?label ?notation ?oldnotation (lang(?label) as ?lang) (lang(?altlabel) as ?altlang) ?altlabel ?description ?unit ?label2 (lang(?label2) as ?lang2) ?status ?creator 
      WHERE { 
        ?element skos:prefLabel ?label . 
        OPTIONAL { ?element skos:prefLabel ?label2 . FILTER (!(lang(?label2) = 'en')) } . 
        OPTIONAL { ?element skos:notation ?notation } .
        OPTIONAL { 
          ?element prov:wasDerivedFrom+ ?oldconcept .
          ?cs a cs:ChangeSet ;
            cs:removal [
              a rdf:Statement;
              rdf:subject ?oldconcept;
              rdf:predicate skos:notation;
              rdf:object ?oldnotation
            ] .
        } . 	
        OPTIONAL { ?element dc:description ?description } . 
        OPTIONAL { ?element :unit ?unit } . 
        OPTIONAL { ?element skos:altLabel ?altlabel } . 
        OPTIONAL { ?element :status ?status } . 
        OPTIONAL { ?element dc:creator ?creator } . 
        OPTIONAL { 
          ?element prov:wasDerivedFrom+ [ skos:notation ?oldnotation ] 
        } . 
        FILTER ((regex(?label, '${pattern}', 'i') 
          || regex(?label2, '${pattern}', 'i') 
          || regex(?altlabel, '${pattern}', 'i') 
          || regex(?notation, '${pattern}', 'i') 
          || regex(?oldnotation, '${pattern}', 'i') 
          || regex(?description, '${pattern}', 'i') 
          || regex(?unit, '${pattern}', 'i') 
          || regex(?status, '${pattern}', 'i') 
          || regex(?creator, '${pattern}', 'i') ) 
          && (lang(?label) = 'en')
          && (!bound(?notation) || !bound(?oldnotation) || (?notation != ?oldnotation))
        ) . 
      } 
      ORDER BY ASC(lcase(?label)) `;
  }
}

export interface SearchResultAttributes {
  element:JSONResponsePartUriString,
  label:JSONResponsePartString,
  notation:JSONResponsePartString,
  oldnotation:JSONResponsePartString,
  lang:JSONResponsePartString,
  altlang:JSONResponsePartString,
  altlabel:JSONResponsePartString,
  description:JSONResponsePartString,
  unit:JSONResponsePartString,
  label2:JSONResponsePartString,
  lang2:JSONResponsePartString,
  status:JSONResponsePartString,
  creator:JSONResponsePartString
}