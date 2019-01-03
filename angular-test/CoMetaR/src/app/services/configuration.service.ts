import { Injectable } from '@angular/core';
import { OntologyElementDetails } from './queries/element-details.service';
import { merge } from 'rxjs/operators';
import { isObject } from 'util';

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
