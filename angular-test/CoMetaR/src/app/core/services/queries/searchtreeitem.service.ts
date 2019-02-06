import { Injectable } from '@angular/core';
import { DataService, prefixes, JSONResponsePartUriString, JSONResponsePartString } from '../../../services/data.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SearchtreeitemService {

  constructor(private dataService: DataService) { }

  public get(pattern:string):Observable<SearchResultAttributes[]> { 
      if (pattern == "") return of([]);
      const queryString = this.getQueryString(pattern);
      return this.dataService.getData(queryString);
  };

  private getQueryString(pattern:string):string {
      return `
      ${prefixes}
      SELECT ?element ?label ?notation ?oldnotation ?altlabel ?description ?unit ?label2 ?status ?creator
      WHERE { 
        ?element rdf:type ?t .
        OPTIONAL { ?element skos:prefLabel ?label FILTER ((lang(?label) = 'en') && regex(?label, '${pattern}', 'i')) } . 
        OPTIONAL { ?element skos:prefLabel ?label2 . FILTER (!(lang(?label2) = 'en') && regex(?label2, '${pattern}', 'i')) } . 
        OPTIONAL { ?element skos:notation ?notation FILTER(regex(?notation, '${pattern}', 'i')) } .
        OPTIONAL { 
          ?element prov:wasDerivedFrom+ ?oldconcept .
          ?cs a cs:ChangeSet ;
            cs:removal [
              a rdf:Statement;
              rdf:subject ?oldconcept;
              rdf:predicate skos:notation;
              rdf:object ?oldnotation
            ] .
            FILTER(regex(?oldnotation, '${pattern}', 'i'))
        } . 	
        OPTIONAL { ?element dc:description ?description FILTER(regex(?description, '${pattern}', 'i')) } . 
        OPTIONAL { ?element :unit ?unit FILTER(regex(?unit, '${pattern}', 'i')) } . 
        OPTIONAL { ?element skos:altLabel ?altlabel FILTER(regex(?altlabel, '${pattern}', 'i')) } . 
        OPTIONAL { ?element :status ?status FILTER(regex(?status, '${pattern}', 'i')) } . 
        OPTIONAL { ?element dc:creator ?creator FILTER(regex(?creator, '${pattern}', 'i')) } . 
        OPTIONAL { ?element prov:wasDerivedFrom+ [ skos:notation ?oldnotation ] FILTER(regex(?oldnotation, '${pattern}', 'i')) } . 
        FILTER (bound(?label) || bound(?notation) || bound(?oldnotation) || bound(?altLabel) || bound(?description) || bound(?unit) || bound(?label2) || bound(?status) || bound(?creator))
      } `;
  }
}

export interface SearchResultAttributes {
  element:JSONResponsePartUriString,
  label?:JSONResponsePartString,
  notation?:JSONResponsePartString,
  oldnotation?:JSONResponsePartString,
  altlabel?:JSONResponsePartString,
  description?:JSONResponsePartString,
  unit?:JSONResponsePartString,
  label2?:JSONResponsePartString,
  status?:JSONResponsePartString,
  creator?:JSONResponsePartString
}