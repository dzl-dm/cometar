import { Injectable } from '@angular/core';
import { Observable, throwError, Subject, BehaviorSubject, ReplaySubject, of, combineLatest, Subscription, from } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { map, catchError, startWith, shareReplay, retry, first, flatMap, last, mergeMap } from 'rxjs/operators';
import { BrowserService } from '../core/services/browser.service';
import { ProgressService } from './progress.service';
import { ConfigurationService } from './configuration.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(
    private http: HttpClient,
    private browserService: BrowserService,
    private progressService: ProgressService,
    private configurationService: ConfigurationService
  ) { 
    this.configurationService.configurationLoaded$.subscribe(()=>{
      this.baseUrl=this.configurationService.settings.sparql.endpoint_base
      this.prefixes+=`
PREFIX : <${this.configurationService.settings.rdf.base_prefix}>`
    })
  }

  private pendings = {};
  public loading = new BehaviorSubject<boolean>(false);
  public loadingNames = new BehaviorSubject<string[]>([]);
  public busyQueriesStartTimes: number[] = [];
  private busyQueries = [];
  private dataUrl$ = new BehaviorSubject<string>("");
  private baseUrl:string;
  private server:'live'|'dev';
  public setServer(s: 'live' | 'dev') {
    this.server=s
    if (this.server == 'dev' && this.configurationService.getServer() != 'dev') { 
      this.dataUrl$.next(this.baseUrl + 'cometar_dev/query')
    }
    else if (this.server == 'live' && this.configurationService.getServer() != 'live') { 
      this.dataUrl$.next(this.baseUrl + 'cometar_live/query');
    }
    this.configurationService.setServer(s);
  }

  getData(queryString: string, queryName: string, typerules?: {}): Observable<any[]> {
    if (!this.pendings[queryString]) {
      this.pendings[queryString] = new ReplaySubject<any>(1);
      this.dataUrl$.subscribe(url => {
        this.progressService.addTask();
        this.loading.next(true);
        this.busyQueries.push(queryName);
        this.busyQueriesStartTimes.push(Date.now().valueOf());
        this.loadingNames.next(this.busyQueries);
        let s: Subscription;
        s = this.getObservable(url, queryString, typerules).subscribe(data => {


          if (data instanceof HttpErrorResponse) {
            this.browserService.snackbarNotification.next([data.message, 'error']);
            this.pendings[queryString] = of([]);
          }
          this.progressService.taskDone();

          let index = this.busyQueries.indexOf(queryName);
          this.busyQueries.splice(index, 1);
          this.busyQueriesStartTimes.splice(index, 1);
          this.loadingNames.next(this.busyQueries);
          if (this.busyQueries.length == 0) { this.loading.next(false); }


          this.pendings[queryString].next(data);
          if (s) { s.unsubscribe(); }
        });
      })
    }
    return this.pendings[queryString].pipe(
      map(data => {
        if (data instanceof HttpErrorResponse) { return []; }
        else { return data; }
      })/*,
      first()*/
    );
  }

  private getObservable(url: string, queryString: string, typerules?: {}): Observable<any[]> {
    if (url == "") { return of([]); }
    return this.http.get<JSONResponse>(
      url + "?query=" + encodeURIComponent(queryString),
      { observe: 'response', headers: { 'Accept': 'application/sparql-results+json; charset=utf-8' } }
    ).pipe(
      map(data => data.body.results.bindings
        .map((binding: {}) => {
          Object.entries(binding).forEach(
            ([key, part]: [string, JSONResponsePart]) => {
              if (part.datatype && part.datatype == "http://www.w3.org/2001/XMLSchema#boolean") { part.value = part.value == "true"; }
              if (part.datatype && part.datatype == "http://www.w3.org/2001/XMLSchema#dateTime") { part.value = new Date(part.value); }
              if (typerules && typerules[key] && typerules[key] == "|array") { part.value = part.value.split("|"); }
              delete part.datatype;
              delete part.type;
            }
          );
          return binding
        })),
      catchError((err) => {
        return of(err);
      })
    )
  }

  /*private handleError(error: HttpErrorResponse) {
    console.log(error);
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
  };*/

  

  public prefixes: string = `
  PREFIX skos:    <http://www.w3.org/2004/02/skos/core#>
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
}

interface JSONResponse {
  "head": {
    "vars": []
  },
  "results": {
    "bindings": any[]
  }
}

interface JSONResponsePart {
  type: string,
  "xml:lang"?: string,
  value: any,
  datatype?: string
}

export interface JSONResponsePartBoolean {
  value: boolean,
  name?: string
}

export interface JSONResponsePartLangString {
  "xml:lang": string,
  value: string,
  name?: string
}

export interface JSONResponsePartUriString {
  value: string,
  name?: string
}

export interface JSONResponsePartNumber {
  value: number,
  name?: string
}

export interface JSONResponsePartString {
  value: string,
  name?: string
}

export interface JSONResponsePartDate {
  value: Date,
  name?: string
}

export interface JSONResponsePartArray {
  value: string[],
  name?: string
}