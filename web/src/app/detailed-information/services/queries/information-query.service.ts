import { Injectable } from '@angular/core';
import { JSONResponsePartUriString, JSONResponsePartLangString, JSONResponsePartString, JSONResponsePartDate, DataService, JSONResponsePartBoolean, } from 'src/app/services/data.service';
import { BehaviorSubject, Observable, ReplaySubject } from 'rxjs';
import { flatMap, map, mergeMap } from 'rxjs/operators';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class InformationQueryService {
  public predicateDefinitions$:ReplaySubject<RDFPredicateDefinition[]> = new ReplaySubject<RDFPredicateDefinition[]>(1)
  predicate_filter_snippet:string = ""

  constructor(private dataService: DataService, private configurationService:ConfigurationService) {
    var queryString = this.getPredicateDefinitionsQueryString()
    this.predicateDefinitions$.next([])
    this.dataService.getData(queryString, "definitions for RDF predicates")
      .pipe(map(data=> {
          var x = (<RDFPredicateDefinition[]> data)
          if (x.length == 0){
            x = this.predicateDefinitionsDefault
          }
          return x.sort((a,b)=>{
            var indexA=a.cometar_display_index.value.split(":")
            var indexB=b.cometar_display_index.value.split(":")
            if (indexA[0]>indexB[0]) return 1
            if (indexA[0]<indexB[0]) return -1
            if (indexA[1]>indexB[1]) return 1
            if (indexA[1]<indexB[1]) return -1
            return 0
          })
        }))
      .subscribe(this.predicateDefinitions$)
  }

  public get(iri:string):Observable<ConceptAttributeDetail[]> {
      //const queryString = this.getQueryString(iri);
      return this.predicateDefinitions$.pipe(mergeMap(
        predicateDefinitions => {
          this.predicate_filter_snippet = "FILTER (?predicate IN ("+predicateDefinitions.map(
            def => "<"+def.predicate.value+">"
          ).join(", ")+"))."
          var conceptAttributesQueryString=this.getConceptAttributesQueryString(iri)
          return this.dataService.getData(conceptAttributesQueryString, "information for concept "+iri)
            .pipe(map(data=> { return <ConceptAttributeDetail[]> data }))
          //return this.dataService.getData(queryString, "information for concept "+iri).pipe(map(data=> { return <OntologyElementDetails[]> data }))
        }
      )) 
  };

  public getConceptAttributesQueryString(iri):string {
    return `#concept information
      ${this.dataService.prefixes}

      SELECT DISTINCT ?element ?predicate ?value ?valuelabel (isIri(?value) AS ?isIri)
      WHERE {
        {
          ?element ?predicate ?value .
          ${this.predicate_filter_snippet}
          FILTER (?element = <${iri}>) .
        }  
        UNION
        { 
          ?element skos:broader* [ rdf:hasPart ?modifier ] . 
          ?modifier skos:prefLabel ?modifierlabel FILTER (lang(?modifierlabel)='en') .
          BIND(rdf:hasPart AS ?predicate) .
          BIND(?modifier AS ?value) .
          FILTER (?element = <${iri}>) .          
        }
        UNION 
        {
          SELECT ?element ?predicate (MAX(?changesdate) AS ?value)
          WHERE
          {
            ?commit prov:qualifiedUsage ?usage ;
              prov:endedAtTime ?changesdate .
            ?usage ?addorremove ?statement .
            ?statement a rdf:Statement ; 
              rdf:subject ?element .
            FILTER (?element = <${iri}>) .          
            FILTER NOT EXISTS { ?statement rdf:comment "hidden" }  .
            BIND(prov:endedAtTime AS ?predicate)
          }
          GROUP BY ?element ?predicate
        }
        OPTIONAL {?value skos:prefLabel ?prefLabel FILTER (lang(?prefLabel) = 'en')}
        OPTIONAL {?value rdf:label ?rdfLabel FILTER (lang(?rdfLabel) = 'en')}
        OPTIONAL {?value dzl:displayLabel ?displayLabel FILTER (lang(?displayLabel) = 'en')}
        BIND(COALESCE(?displayLabel,?prefLabel,?rdfLabel) AS ?valuelabel)
      }
    `
  }

  private getPredicateDefinitionsQueryString():string {
    return `#definitions for RDF predicates
    ${this.dataService.prefixes}
    
    SELECT ?predicate (SAMPLE(?labels) as ?label) ?cometar_display_index
    WHERE
    {
      ?predicate a dzl:conceptAttribute;
      rdf:label ?labels ;
      dzl:cometarDisplayIndex ?cometar_display_index.
      FILTER (lang(?labels)='en').
    }
    GROUP BY ?predicate ?cometar_display_index
    `;
  }

  private predicateDefinitionsDefault = <RDFPredicateDefinition[]>[
    {"predicate":{"value":"http://www.w3.org/2004/02/skos/core#prefLabel"},"label":{"xml:lang":"en","value":"Label"},"cometar_display_index":{"value":"1:1"}},
    {"predicate":{"value":"http://www.w3.org/2004/02/skos/core#altLabel"},"label":{"xml:lang":"en","value":"Alternative label"},"cometar_display_index":{"value":"1:2"}},
    {"predicate":{"value":"http://www.w3.org/2004/02/skos/core#notation"},"label":{"xml:lang":"en","value":"Code"},"cometar_display_index":{"value":"1:3"}},
    {"predicate":{"value":"http://sekmi.de/histream/dwh#restriction"},"label":{"xml:lang":"en","value":"Data type"},"cometar_display_index":{"value":"1:4"}},
    {"predicate":{"value":"http://data.dzl.de/ont/dwh#unit"},"label":{"xml:lang":"en","value":"Unit"},"cometar_display_index":{"value":"1:5"}},
    {"predicate":{"value":"http://data.dzl.de/ont/dwh#status"},"label":{"xml:lang":"en","value":"Status"},"cometar_display_index":{"value":"1:6"}},
    {"predicate":{"value":"http://purl.org/dc/elements/1.1/creator"},"label":{"xml:lang":"en","value":"Creator"},"cometar_display_index":{"value":"2:5"}},
    {"predicate":{"value":"http://purl.org/dc/elements/1.1/description"},"label":{"xml:lang":"en","value":"Description"},"cometar_display_index":{"value":"2:6"}},
    {"predicate":{"value":"http://www.w3.org/2004/02/skos/core#editorialNote"},"label":{"xml:lang":"en","value":"Editorial note"},"cometar_display_index":{"value":"2:7"}},
    {"predicate":{"value":"http://www.w3.org/2004/02/skos/core#related"},"label":{"xml:lang":"en","value":"Related to"},"cometar_display_index":{"value":"2:8"}},
    {"predicate":{"value":"http://www.w3.org/ns/prov#endedAtTime"},"label":{"xml:lang":"en","value":"Last Changes Date"},"cometar_display_index":{"value":"2:9"}}
  ]
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

export interface ConceptAttributeDetail {
  element:JSONResponsePartUriString,
  predicate:JSONResponsePartUriString|JSONResponsePartString,
  value:JSONResponsePartUriString|JSONResponsePartString|JSONResponsePartLangString,
  valuelabel?:JSONResponsePartString,
  isIri:JSONResponsePartBoolean
}

export interface RDFPredicateDefinition {
  predicate:JSONResponsePartUriString,
  label:JSONResponsePartLangString,
  cometar_display_index:JSONResponsePartString
}