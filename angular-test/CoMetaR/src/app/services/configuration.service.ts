import { Injectable } from '@angular/core';
import { OntologyElementDetails } from '../detailed-information/element-details.service';
import { isObject } from 'util';
import { CommitMetaData } from '../provenance/services/queries/commit-meta-data.service';
import { CommitDetails } from '../provenance/services/queries/commit-details.service';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  constructor() { }
  public getRdfPrefixMap(){
    return {
      "http://data.dzl.de/ont/dwh#": "dzl",
      "http://purl.bioontology.org/ontology/SNOMEDCT/": "snomed",
      "http://loinc.org/owl#": "loinc"
    }
  }
  public getHumanReadableElementDetails(ed:OntologyElementDetails):OntologyElementDetails{
    return this.mergeDeep(ed, {
      element: { name: "RDF IRI" },
      altlabel: { name: "Alternative Label" },
      author: { name: "Author" },
      description: { name: "Description" },
      domain: { name: "Domain", value: ed.domain?this.getHumanReadableValueDomain(ed.domain.value):null },
      editnote: { name: "Editorial Notes" },
      label: { name: "Label" },
      modifier: { name: "Specifications" },
      status: { name: "Status" },
      type: { name: "Type" },
      unit: { name: "Unit" },
      notation: { name: "Code" },
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
    });
  }
  public getHumanReadableCommitDetailData(data:CommitDetails):CommitDetails{
    return this.mergeDeep(data,{
      predicate: { value: data.predicate?this.getHumanReadableRDFPredicate(data.predicate.value):"" }
    });
  }
  private rdfUrlMap = {
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
		"http://sekmi.de/histream/dwh#dateRestriction": "Date"
  }
  public getHumanReadableRDFPredicate(p:string):string{
    return this.rdfUrlMap[p] || p;
  }

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
