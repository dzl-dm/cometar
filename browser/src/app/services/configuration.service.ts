import { Injectable } from '@angular/core';
import { CommitMetaData } from '../provenance/services/queries/commit-meta-data.service';
import { CommitDetails } from '../provenance/services/queries/commit-details.service';
import { OntologyElementDetails } from '../detailed-information/services/queries/information-query.service';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  public settings: IConfiguration;
  public configurationLoaded$=new Subject()
  constructor(
    private http: HttpClient
  ) {}
  load() {
    const jsonFile = `assets/config/config.json`;
    return new Promise<void>((resolve, reject) => {
        this.http.get(jsonFile).toPromise().then((response : IConfiguration) => {
          this.settings = <IConfiguration>response;
          
          this.uniquePredicates=[
            "http://www.w3.org/2004/02/skos/core#prefLabel", 
            "http://www.w3.org/2004/02/skos/core#altLabel",
            this.settings.rdf.base_prefix+"status",
            "http://sekmi.de/histream/dwh#restriction",
            this.settings.rdf.base_prefix+"displayLabel"
          ]
          this.rdfUrlMap[this.settings.rdf.base_prefix+"status"]="Status"
          this.rdfUrlMap[this.settings.rdf.base_prefix+"displayLabel"]="Display Label"
          this.rdfUrlMap[this.settings.rdf.base_prefix+"topLevelNode"]="Is Top Level Node"
          this.rdfUrlMap[this.settings.rdf.base_prefix+"unit"]="Unit"

          this.changeCategories[this.settings.rdf.base_prefix+"displayLabel"]="literal"
          this.changeCategories[this.settings.rdf.base_prefix+"topLevelNode"]="structure"
          this.changeCategories[this.settings.rdf.base_prefix+"unit"]="semantic"
          this.changeCategories[this.settings.rdf.base_prefix+"status"]="progress"

          this.initialCheckedPredicates[this.settings.rdf.base_prefix+"displayLabel"]=true
          this.initialCheckedPredicates[this.settings.rdf.base_prefix+"unit"]=true
          this.initialCheckedPredicates[this.settings.rdf.base_prefix+"status"]=true
          resolve();
          this.configurationLoaded$.next()
        }).catch((response: any) => {
          reject(`Could not load file '${jsonFile}': ${JSON.stringify(response)}`);
        });
    });
  }
  private server:'live'|'dev';
  public setServer(s:'live'|'dev'){
    this.server = s;
  }
  public getServer():'live'|'dev'{
    return this.server;
  }
  public getRdfPrefixMap():{}{
    this.settings.rdf.base_prefix
    let result = {
      "http://purl.bioontology.org/ontology/SNOMEDCT/": "snomed",
      "http://loinc.org/owl#": "loinc"
    }
    result[this.settings.rdf.base_prefix]="org"
    return result
  }
  
  public shortenRdfPrefix(s:string):string{
    Object.entries(this.getRdfPrefixMap()).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value + ":")
    });
    return s;
  }
  public extendRdfPrefix(s:string):string{
    if (!s) return undefined;
    let c = s.substr(s.indexOf(":")+1);
    Object.entries(this.getRdfPrefixMap()).forEach(
      ([value, key]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });
    return s.substring(0,s.length-c.length-1) + c;
  } 
  public getHumanReadableElementDetails(ed:OntologyElementDetails):OntologyElementDetails{
    return this.mergeDeep(ed, {
      element: { name: "RDF IRI" },
      altlabel: { name: "Alternative Label" },
      author: { name: "Author" },
      description: { name: "Description" },
      domain: { name: "Data Type", value: ed.domain?this.getHumanReadableValueDomain(ed.domain.value):null },
      editnote: { name: "Editorial Notes" },
      label: { name: "Label" },
      modifier: { name: "Specifications" },
      lastchangesdate: { name: "Last Changes" },
      status: { name: "Status" },
      type: { name: "Type" },
      unit: { name: "Unit" },
      notation: { name: "Code" },
      related: { name: "Related" },
    });
  }

  public getHumanReadableValueDomain(domain:string):string{
    switch(domain){
      case "http://sekmi.de/histream/dwh#floatRestriction":
        return "Decimal";
      case "http://sekmi.de/histream/dwh#integerRestriction":
        return "Integer";
      case "http://sekmi.de/histream/dwh#dateRestriction":
        return "Date";
      case "http://sekmi.de/histream/dwh#partialDateRestriction":
        return "Partial Date";
      default:
        return domain;
    }
  }

  public getHumanReadableCommitMetaData(data:CommitMetaData):CommitMetaData{
    return this.mergeDeep(data,{
      commitid: { value: data.commitid.value.substr(data.commitid.value.length-40) },
      author: { value: this.cutPrefix(data.author.value) }
    });
  }
  public getHumanReadableCommitDetailData(data:CommitDetails):CommitDetails{
    return this.mergeDeep(data,<CommitDetails>{
      predicate: { value: data.predicate?this.getHumanReadableRDFPredicate(data.predicate.value):"" },
      ol: { value: this.decodeHTML(data.ol?data.ol.value:data.object?this.getHumanReadableRDFPredicate(data.object.value):"")}
    });
  }
  private decodeHTML(s:string):string{
    return s.replace(/&quot;/g,"\"");
  }
  public uniquePredicates = []

  public rdfUrlMap = {
    "http://purl.org/dc/elements/1.1/description": "Description",
    "http://www.w3.org/2004/02/skos/core#prefLabel": "Label",
    "http://www.w3.org/2004/02/skos/core#altLabel": "Alternative Label",
    "http://www.w3.org/2004/02/skos/core#notation": "Code",
    "http://www.w3.org/2004/02/skos/core#broader": "Parent Element",
    "http://www.w3.org/2004/02/skos/core#narrower": "Child Element",
    "http://www.w3.org/2004/02/skos/core#Concept": "Concept",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": "Modifier",
    "http://sekmi.de/histream/dwh#restriction": "Datatype",
    "http://purl.org/dc/elements/1.1/creator": "Author",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#about": "Concept Identifier",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "Classification",
    "http://sekmi.de/histream/dwh#integerRestriction": "Integer",
    "http://sekmi.de/histream/dwh#stringRestriction": "String",
    "http://sekmi.de/histream/dwh#floatRestriction": "Float",
    "http://sekmi.de/histream/dwh#partialDateRestriction": "Partial Date",
    "http://www.w3.org/2004/02/skos/core#member": "Collection Member",
    "http://www.w3.org/2004/02/skos/core#editorialNote": "Editorial Note",
    "http://www.w3.org/ns/prov#wasDerivedFrom": "Previous Concept Identifier",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf": "Specification Of Concept",
    "http://www.w3.org/2004/02/skos/core#topConceptOf": "Top Concept Of",
    "http://www.w3.org/2004/02/skos/core#Collection": "Collection",
    "http://sekmi.de/histream/dwh#dateRestriction": "Date",
    "http://www.w3.org/2004/02/skos/core#hasTopConcept": "Has Top Concept",
    "http://www.w3.org/2004/02/skos/core#related": "Related Concepts"
  }
  public getHumanReadableRDFPredicate(p:string):string{
    return this.rdfUrlMap[p] || p;
  }
  public getRDFPredicateByHumanReadableString(p:string):string[]{
    return Object.keys(this.rdfUrlMap).filter(key=>this.rdfUrlMap[key] == p);
  }
  public cutPrefix(s:string):string{
    Object.keys(this.getRdfPrefixMap()).forEach((key,value) => {
      s = s.replace(key, "");
    });
    return s;
  }

  public changeCategories = {
    "http://www.w3.org/2004/02/skos/core#prefLabel": "literal",
    "http://www.w3.org/2004/02/skos/core#altLabel": "literal",
    "http://purl.org/dc/elements/1.1/description": "literal",
    
    "http://www.w3.org/2004/02/skos/core#narrower": "structure",
    "http://www.w3.org/2004/02/skos/core#broader": "structure",
    "http://www.w3.org/2004/02/skos/core#hasTopConcept": "structure",
    "http://www.w3.org/2004/02/skos/core#topConceptOf": "structure",
    "http://www.w3.org/2004/02/skos/core#member": "structure",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": "structure",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf": "structure",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "structure",
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#about": "structure",
    "http://www.w3.org/ns/prov#wasDerivedFrom": "structure",
    "http://www.w3.org/2004/02/skos/core#related": "structure",
    
    "http://www.w3.org/2004/02/skos/core#notation": "semantic",
    
    "http://www.w3.org/2004/02/skos/core#editorialNote": "progress",
    "http://sekmi.de/histream/dwh#restriction": "progress",
    
    "http://purl.org/dc/elements/1.1/creator": undefined,
    "http://www.w3.org/2004/02/skos/core#description": undefined,
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#isPartOf": undefined,
    "http://www.w3.org/2004/02/skos/core#inScheme": undefined,
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#broader": undefined,
    "http://www.w3.org/2004/02/skos/core#prefLAbel": undefined,
    "http://purl.org/dc/elements/1.1/descriptions": undefined,
    "http://www.w3.org/2002/07/owl#onProperty": undefined,
    "http://www.w3.org/2002/07/owl#allValuesFrom": undefined
  }
  public getCategory(cd:CommitDetails):string{
    return this.changeCategories[cd.predicate.value];
  }
  public initialCheckedPredicates={    
    "http://www.w3.org/2004/02/skos/core#prefLabel": true,
    "http://www.w3.org/2004/02/skos/core#altLabel": true,
    "http://purl.org/dc/elements/1.1/description": true,
    "http://www.w3.org/2004/02/skos/core#notation": true,		
    "http://www.w3.org/2004/02/skos/core#editorialNote": true,
    "http://sekmi.de/histream/dwh#restriction": true,
  }

  public lastChangesExcludedPredicates=[
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
  ]

  private mergeDeep(target, source) {
    let output = Object.assign({}, target);
    if (target!== null && typeof target === 'object' && source!== null && typeof source === 'object') {
      Object.keys(source).forEach(key => {
        if (source[key] !== null && typeof source[key] === 'object') {
          if (!(key in target))
            Object.assign(output, { [key]: source[key] });
          else
            output[key] = this.mergeDeep(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }
}

export interface IConfiguration{
  "logos": {
    "src_cometar_small":string,
    "src_brand_small":string,
    "href_brand":string
  },
  "rdf": {
      "base_prefix":string
  },
  "sparql": {
    "endpoint_base":string
  },
  "modules": {
      "provenance": {
          "active": boolean
      },
      "sparql": {
          "active": boolean
      },
      "client-configuration": {
          "active": boolean
      }
  }
}