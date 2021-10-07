import { Injectable } from '@angular/core';
import json from "src/assets/data/LoincCodes.json";

@Injectable({
  providedIn: 'root'
})
export class ExternalCodeInformationService {

  constructor() { }

  public getInformation(code:string):{}{
    return json[code];
  }
}
