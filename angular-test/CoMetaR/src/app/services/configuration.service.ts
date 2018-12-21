import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  public getRdfPrefixMap(){
    return {
      "http://data.dzl.de/ont/dwh#": "dzl",
      "http://purl.bioontology.org/ontology/SNOMEDCT/": "snomed",
      "http://loinc.org/owl#": "loinc"
    }
  }
  constructor() { }
}
