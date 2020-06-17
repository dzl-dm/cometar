import { Injectable } from '@angular/core';
import { isObject } from 'util';
import { CommitMetaData } from '../provenance/services/queries/commit-meta-data.service';
import { CommitDetails } from '../provenance/services/queries/commit-details.service';
import { OntologyElementDetails } from '../detailed-information/services/queries/information-query.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  constructor() { }

  private server:'live'|'dev';
  public setServer(s:'live'|'dev'){
    this.server = s;
  }
  public getServer():'live'|'dev'{
    return this.server;
  }
  public getRdfPrefixMap():{}{
    return {
      "http://data.dzl.de/ont/dwh#": "dzl",
      "http://purl.bioontology.org/ontology/SNOMEDCT/": "snomed",
      "http://loinc.org/owl#": "loinc"
    }
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
  public uniquePredicates = [
    "http://www.w3.org/2004/02/skos/core#prefLabel", 
    "http://www.w3.org/2004/02/skos/core#altLabel",
    "http://data.dzl.de/ont/dwh#status",
    "http://sekmi.de/histream/dwh#restriction",
    "http://data.dzl.de/ont/dwh#displayLabel"
  ]

  public rdfUrlMap = {
    "http://data.dzl.de/ont/dwh#status":"Status",    
		"http://purl.org/dc/elements/1.1/description": "Description",
		"http://www.w3.org/2004/02/skos/core#prefLabel": "Label",
		"http://www.w3.org/2004/02/skos/core#altLabel": "Alternative Label",
		"http://www.w3.org/2004/02/skos/core#notation": "Code",
		"http://www.w3.org/2004/02/skos/core#broader": "Parent Element",
		"http://www.w3.org/2004/02/skos/core#narrower": "Child Element",
		"http://www.w3.org/2004/02/skos/core#Concept": "Concept",
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": "Modifier",
		"http://sekmi.de/histream/dwh#restriction": "Datatype",
		"http://data.dzl.de/ont/dwh#displayLabel": "Display Label",
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
    "http://data.dzl.de/ont/dwh#topLevelNode": "Is Top Level Node",
    "http://data.dzl.de/ont/dwh#unit": "Unit",
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
		"http://data.dzl.de/ont/dwh#displayLabel": "literal",
		
		"http://www.w3.org/2004/02/skos/core#narrower": "structure",
		"http://www.w3.org/2004/02/skos/core#broader": "structure",
		"http://www.w3.org/2004/02/skos/core#hasTopConcept": "structure",
		"http://www.w3.org/2004/02/skos/core#topConceptOf": "structure",
		"http://www.w3.org/2004/02/skos/core#member": "structure",
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#hasPart": "structure",
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#partOf": "structure",
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#type": "structure",
		"http://www.w3.org/1999/02/22-rdf-syntax-ns#about": "structure",
		"http://data.dzl.de/ont/dwh#topLevelNode": "structure",
		"http://www.w3.org/ns/prov#wasDerivedFrom": "structure",
		"http://www.w3.org/2004/02/skos/core#related": "structure",
		
		"http://data.dzl.de/ont/dwh#unit": "semantic",
		"http://www.w3.org/2004/02/skos/core#notation": "semantic",
		
		"http://www.w3.org/2004/02/skos/core#editorialNote": "progress",
		"http://data.dzl.de/ont/dwh#status": "progress",
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
		"http://data.dzl.de/ont/dwh#displayLabel": true,
    "http://purl.org/dc/elements/1.1/description": true,
    "http://data.dzl.de/ont/dwh#unit": true,
		"http://www.w3.org/2004/02/skos/core#notation": true,		
		"http://www.w3.org/2004/02/skos/core#editorialNote": true,
		"http://data.dzl.de/ont/dwh#status": true,
		"http://sekmi.de/histream/dwh#restriction": true,
  }

  public lastChangesExcludedPredicates=[
    "http://www.w3.org/1999/02/22-rdf-syntax-ns#type"
  ]

  private mergeDeep(target, source) {
    let output = Object.assign({}, target);
    if (isObject(target) && isObject(source)) {
      Object.keys(source).forEach(key => {
        if (isObject(source[key])) {
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
