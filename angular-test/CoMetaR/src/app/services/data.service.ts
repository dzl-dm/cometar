import { Injectable } from '@angular/core';
import { Observable, throwError, Subject, BehaviorSubject, ReplaySubject } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class DataService {

  private pendings = {}
  dataUrl = 'https://data.dzl.de/fuseki/cometar_live/query';

  getData(queryString:string, logstart?:()=>void, logend?:(result:any[])=>void): Observable<any[]> {
    if (!this.pendings[queryString]){
      let rs = new ReplaySubject<any[]>(1);
      this.getObservable(queryString).subscribe(rs)
      this.pendings[queryString] = rs;
      //this.pendings[queryString] = this.getObservable(queryString).pipe(shareReplay(1));
    }
    return this.pendings[queryString];
  }
  constructor(private http:HttpClient) { }

  private getObservable(queryString:string):Observable<any[]>{
    return this.http.get<JSONResponse>(
      this.dataUrl+"?query="+encodeURIComponent(queryString),
      { observe: 'response', headers:{'Accept': 'application/sparql-results+json; charset=utf-8'}}
    ).pipe(
      map(data => data.body.results.bindings
        .map((binding:{}) => {
          Object.entries(binding).forEach(
            ([key, part]:[string,JSONResponsePart]) => {
              if (part.datatype && part.datatype == "http://www.w3.org/2001/XMLSchema#boolean") part.value = part.value == "true";
              delete part.datatype;
              delete part.type;
            }
          );
          return binding
        })),
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  };
}

interface JSONResponse {
  "head":{
    "vars":[]
  },
  "results":{
    "bindings":any[]
  }
}

interface JSONResponsePart {
  type:string,
  "xml:lang"?:string,
  value:any,
  datatype?:string
}

export interface JSONResponsePartBoolean {
  value:boolean,
  name?:string
}

export interface JSONResponsePartLangString {
  "xml:lang":string,
  value:string,
  name?:string
}

export interface JSONResponsePartUriString {
  value:string,
  name?:string
}

export interface JSONResponsePartNumber {
  value:number,
  name?:string
}

export interface JSONResponsePartString {
  value:string,
  name?:string
}

export interface JSONResponsePartDate {
  value:Date,
  name?:string
}

export const prefixes:string = `
PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
PREFIX : <http://data.dzl.de/ont/dwh#>
PREFIX rdf:	<http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX dc: <http://purl.org/dc/elements/1.1/>  
PREFIX snomed:    <http://purl.bioontology.org/ontology/SNOMEDCT/>
PREFIX xsd:	<http://www.w3.org/2001/XMLSchema#>
PREFIX dwh:    <http://sekmi.de/histream/dwh#>
PREFIX loinc: <http://loinc.org/owl#>
PREFIX rdfs:	<http://www.w3.org/2000/01/rdf-schema#> 
PREFIX prov: 	<http://www.w3.org/ns/prov#>
PREFIX cs:		<http://purl.org/vocab/changeset/schema#>
`;