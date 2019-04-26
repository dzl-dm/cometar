import { Component, OnInit } from '@angular/core';
import { ElementDetailsService } from "../element-details.service";
import { ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map, flatMap } from 'rxjs/operators';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { BrowserService } from 'src/app/core/services/browser.service';
import { CommitDetailsService } from 'src/app/provenance/services/queries/commit-details.service';
import { ProvenanceService } from 'src/app/provenance/services/provenance.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { ExternalCodeInformationService } from '../external-code-information.service';
import { InformationQueryService, OntologyElementDetails } from '../services/queries/information-query.service';
import { ExportService } from '../services/export.service';

@Component({
  selector: 'app-detailed-information',
  templateUrl: './detailed-information.component.html',
  styleUrls: ['./detailed-information.component.css']
})
export class DetailedInformationComponent implements OnInit {
  public coreDetails = {};
  public additionalDetails = {};
  public label = "";
  private coreDetailsSelectArray = ["label", "altlabel", "notation", "unit", "status", "domain"];
  private copySelectArray = ["notation"];
  private localizedStringArray = ["label", "altlabel"];
  private ignoreArray = ["type", "modifierlabel"];
  private selectedIri$:BehaviorSubject<string> = new BehaviorSubject("");
  public changeDetails$:Observable<ConceptInformation[]>;
  constructor(
    private elementDetailsService:ElementDetailsService,
    private route:ActivatedRoute,
    private urlService:UrlService,
    private configuration:ConfigurationService,
    private browserService:BrowserService,
    private provenanceService:ProvenanceService,
    private commitDetailsService:CommitDetailsService,
    private externalCodeInformationService:ExternalCodeInformationService,
    private informationQueryService:InformationQueryService,
    private exportService:ExportService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => {
        return this.urlService.extendRdfPrefix(data.get('concept'))
      })
    ).subscribe(this.selectedIri$);
    this.selectedIri$.pipe(
      flatMap(iri => {
        this.label = iri;
        this.coreDetails = {};
        this.additionalDetails = {};
        return this.informationQueryService.get(iri)
      })
    ).subscribe(data => {
      if (data.length == 1 && Object.keys(data[0]).length == 0) {
        this.label += " The concept is not part of the ontology.";
        return;
      }
      //merging details
      data.forEach((detail:OntologyElementDetails) => {
        detail = this.configuration.getHumanReadableElementDetails(detail);
        Object.keys(detail).forEach(key => {
          //special case "type"
          if (this.ignoreArray.includes(key)) return;
          //assign to right list
          if (key=="notation"){
            if (detail[key].value && detail[key].value.indexOf("L:")==0) {
              let infosObject = this.externalCodeInformationService.getInformation(detail[key].value);
              let infosArray:string[][]=[];
              Object.keys(infosObject).forEach(key=>infosArray.push([key,infosObject[key]]))
              this.additionalDetails["loincTable"]={
                name:"LOINC Information", 
                values: infosArray
              }
            }
          }
          let details = this.coreDetailsSelectArray.includes(key)?this.coreDetails:this.additionalDetails;
          //add item to details list if not exist
          details[key] = details[key]||{
            key:key,
            name:detail[key].name,
            values:[],
            //items with copy-to-clipboard text
            copy:this.copySelectArray.includes(key)
          };
          if (detail[key].value){
            let value = "";
            //string localization
            if (this.localizedStringArray.includes(key) && detail[key]["xml:lang"]) value += detail[key]["xml:lang"].toUpperCase() + ": ";
            value += detail[key].value;
            if (key == "label" && detail[key]["xml:lang"] == "en") this.label = detail[key].value;
            if (details[key].values.indexOf(value)==-1) {
              details[key].values.push(value);
            }
          }
        });
      });
    });
  }

  private copyToClipboard(item) {
    document.addEventListener('copy', (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
      document.removeEventListener('copy', null);
    });
    document.execCommand('copy');
    this.browserService.snackbarNotification.next([`Text "${item}" copied to clipboard.`, `info`]);
  }

  public showChangeDetails=false;
  public showMoreChangesToggle(){
    this.showChangeDetails = !this.showChangeDetails;
    if (this.showChangeDetails) {
      let displayOptions = this.configuration.changeCategories;
      Object.keys(displayOptions).forEach(key => {
        displayOptions[key]=displayOptions[key] != undefined;
      });
      this.changeDetails$ = this.selectedIri$.pipe(
        flatMap(subject => this.commitDetailsService.getBySubject(subject)),
        flatMap(cds => this.provenanceService.getConceptTableInformation(cds, new BehaviorSubject(displayOptions)))
      );
    }
    else {
      this.changeDetails$ = of([]);
    }
  }

  public export(){
    this.selectedIri$.subscribe(iri => this.exportService.get(iri, (exportString:string)=>{
      //console.log(exportString);return;
      let thefile = new Blob([exportString], { type: "application/octet-stream" });
      let anchor = document.createElement('a');
  
      anchor.download = "export_"+iri+".csv";
      anchor.href = window.URL.createObjectURL(thefile);
      anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
      anchor.click();
    })).unsubscribe();
  }
}
