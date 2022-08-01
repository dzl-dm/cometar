import { Injectable } from '@angular/core';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Injectable({
  providedIn: 'root'
})
export class UrlService {

  constructor(
    private configuration:ConfigurationService
  ) { }

  
  public shortenRdfPrefix(s:string):string{
    Object.entries(this.configuration.getRdfPrefixMap()).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value + ":")
    });
    return s;
  }
  public extendRdfPrefix(s:string):string{
    if (!s) return "";
    if (s.startsWith("https:") || s.startsWith("http")) return s
    let c = s.substr(s.indexOf(":")+1);
    Object.entries(this.configuration.getRdfPrefixMap()).forEach(
      ([value, key]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });
    return s.substring(0,s.length-c.length-1) + c;
  } 
}
