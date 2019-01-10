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
  public getRdfPrefixMap():{}{
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
      author: { value: this.cutPrefix(data.author.value) }
    });
  }
  public getHumanReadableCommitDetailData(data:CommitDetails):CommitDetails{
    return this.mergeDeep(data,<CommitDetails>{
      predicate: { value: data.predicate?this.getHumanReadableRDFPredicate(data.predicate.value):"" },
      ool: { value: data.ool?data.ool.value:data.oldobject?this.getHumanReadableRDFPredicate(data.oldobject.value):""},
      nol: { value: data.nol?data.nol.value:data.newobject?this.getHumanReadableRDFPredicate(data.newobject.value):""}
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
  public cutPrefix(s:string):string{
    Object.keys(this.getRdfPrefixMap()).forEach((key,value) => {
      s = s.replace(key, "");
    });
    return s;
  }

  changeCagetories = {
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
		"http://data.dzl.de/ont/dwh#topLevelNode": "structure",
		"http://www.w3.org/ns/prov#wasDerivedFrom": "structure",
		
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
    return this.changeCagetories[cd.predicate.value];
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
