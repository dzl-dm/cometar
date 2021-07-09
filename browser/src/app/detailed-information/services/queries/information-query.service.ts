import { Injectable } from '@angular/core';
import { JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartString, JSONResponsePartDate, DataService, } from 'src/app/services/data.service';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class InformationQueryService {

  constructor(private dataService: DataService) { }

  public get(iri:string):Observable<OntologyElementDetails[]> {
      const queryString = this.getQueryString(iri);
      return this.dataService.getData(queryString, "information for concept "+iri).pipe(map(data=> { return <OntologyElementDetails[]> data }))
  };

  public getQueryString(iri?):string {
      return `#concept information
      ${this.dataService.prefixes}
      SELECT ?element ?type ?label ?status ?description ?unit ?altlabel ?author ?domain ?editnote ?modifier ?modifierlabel ?notation ?related (MAX(?changesdate) AS ?lastchangesdate)
      WHERE {	          
          OPTIONAL { <${iri}> skos:prefLabel ?label. }
          OPTIONAL { <${iri}> rdf:type ?type . }
          OPTIONAL { <${iri}> skos:altLabel ?altlabel . }
          OPTIONAL { <${iri}> :status ?status . }
          OPTIONAL { <${iri}> dc:description ?description . }
          OPTIONAL { <${iri}> :unit ?unit . }
          OPTIONAL { <${iri}> dc:creator ?author . }
          OPTIONAL { <${iri}> dwh:restriction ?domain . }
          OPTIONAL { <${iri}> skos:editorialNote ?editnote . }
          OPTIONAL { <${iri}> skos:notation ?notation . }
          OPTIONAL { <${iri}> skos:related ?related . }
          OPTIONAL { 
            <${iri}> skos:broader* [ rdf:hasPart ?modifier ] . 
            ?modifier skos:prefLabel ?modifierlabel FILTER (lang(?modifierlabel)='en') .
          }
          OPTIONAL {
            ?commit prov:qualifiedUsage ?usage ;
              prov:endedAtTime ?changesdate .
            ?usage ?addorremove ?statement .
            ?statement a rdf:Statement ; 
              rdf:subject <${iri}> .
            FILTER NOT EXISTS { ?statement rdf:comment "hidden" } 
          }
          FILTER(bound(?label) && bound(?type) || bound(?changesdate))
      } 
      GROUP BY ?element ?type ?label ?status ?description ?unit ?altlabel ?author ?domain ?editnote ?modifier ?modifierlabel ?notation ?related
      `;
  }
}

export interface OntologyElementDetails {
  element:JSONResponsePartUriString,
  type:JSONResponsePartUriString,
  label:JSONResponsePartLangString,
  description?:JSONResponsePartLangString,
  unit?:JSONResponsePartString,
  altlabel?:JSONResponsePartLangString,
  author?:JSONResponsePartString,
  domain?:JSONResponsePartString,
  editnote?:JSONResponsePartLangString,
  modifier?:JSONResponsePartUriString,
  modifierlabel?:JSONResponsePartString,
  status?:JSONResponsePartString,
  notation?:JSONResponsePartString,
  related?:JSONResponsePartUriString,
  lastchangesdate?:JSONResponsePartDate
}
