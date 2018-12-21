import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UrlService {
  private location: Location;
  constructor() { }

  /*public getCurrentConcept():string{
    let hash = location.hash.substring(1);
    Object.entries(this.urlShorts).forEach(
      ([value, key]:[string,string]) => {
        hash = hash.replace(new RegExp(key, "g"), value)
    });
    return hash;
  }

  public extendPrefix(s:string):string{
    Object.entries(this.urlShorts).forEach(
      ([value, key]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });
    console.log(s);
    return s;
  }

  public setCurrentConcept(s:string){
    Object.entries(this.urlShorts).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });    
    location.replace("#"+s);
  }

  public getLink(s:string){
    Object.entries(this.urlShorts).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value+"/")
    });    
    return s;
  }

  public getLinkProperties(s:string){
    Object.entries(this.urlShorts).forEach(
      ([key, value]:[string,string]) => {
        s = s.replace(new RegExp(key, "g"), value)
    });    
    let link = s.split("/");
    return {prefix: link[0], concept:link[1]};
  }*/
}
