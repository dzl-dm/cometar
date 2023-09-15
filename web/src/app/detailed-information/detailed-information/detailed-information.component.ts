import { Component, OnInit } from '@angular/core';
import { ElementDetailsService } from "../element-details.service";
import { ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map, flatMap, takeUntil, mergeMap } from 'rxjs/operators';
import { BehaviorSubject, combineLatest, merge, Observable, of, Subject } from 'rxjs';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { BrowserService } from 'src/app/core/services/browser.service';
import { CommitDetailsService } from 'src/app/provenance/services/queries/commit-details.service';
import { ProvenanceService } from 'src/app/provenance/services/provenance.service';
import { ConceptInformation } from 'src/app/core/concept-information/concept-information.component';
import { ExternalCodeInformationService } from '../external-code-information.service';
import { ConceptAttributeDetail, InformationQueryService, OntologyElementDetails, RDFPredicateDefinition } from '../services/queries/information-query.service';
import { ExportService } from '../services/export.service';
import { TreeDataService } from 'src/app/core/services/tree-data.service';
import { OntologyAccessService } from '../../core/services/ontology-access.service';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-detailed-information',
  templateUrl: './detailed-information.component.html',
  styleUrls: ['./detailed-information.component.css']
})
export class DetailedInformationComponent implements OnInit {
  
  private unsubscribe: Subject<void> = new Subject();
  
  public coreDetails = [];
  public additionalDetails = [];
  public label = "";
  public lastchangesdateIri = "http://www.w3.org/ns/prov#endedAtTime"
  public validIri = false

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
    private exportService:ExportService,
    private treeDataService:TreeDataService,
    private ontologyAccessService:OntologyAccessService,
    iconRegistry: MatIconRegistry,
    sanitizer: DomSanitizer
  ) { 
    iconRegistry.addSvgIcon('keyboard_arrow_right', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/keyboard_arrow_right.svg'));
  }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => {
        return data.get('concept')
      })
    ).pipe(takeUntil(this.unsubscribe)).subscribe(this.selectedIri$);
    var conceptDetails$ = this.selectedIri$.pipe(
      mergeMap(iri => {
        this.label = iri;
        this.ontologyAccessService.getTreeItem$(iri).subscribe(item => {
          if (item!=undefined) {
            this.label = item.displayLabel.value
            this.validIri = true
          }
        })
        return this.informationQueryService.get(iri)
      })
    ).pipe(takeUntil(this.unsubscribe))
    combineLatest(conceptDetails$,this.informationQueryService.predicateDefinitions$)
      .subscribe(([conceptDetails,predicateDefinitions]) => {
        this.coreDetails = [];
        this.additionalDetails = [];
        //var uniqueDetailsPredicates = conceptDetails.filter((v,i,a) => a.indexOf(v) === i).map(detail => detail.predicate.value)
        for (let def of predicateDefinitions) {
          if (def.label['xml:lang']!='en') return
          var details = []
          if (def.cometar_display_index.value.split(":")[0]=="1") {
            details = this.coreDetails
          }
          else if (def.cometar_display_index.value.split(":")[0]=="2") {
            details = this.additionalDetails
          }
          else {
            return
          }
          var cd = conceptDetails.filter(d => d.predicate.value == def.predicate.value)
          details.push({
            key:def.predicate.value,
            name:def.label.value,
            values:cd.map(d => {
                return {
                  display_string: (d.isIri.value && d.valuelabel && d.valuelabel.value) || d.value.value,
                  display_string_lang: (("xml:lang" in d.value)?(d.value["xml:lang"].toUpperCase()):undefined),
                  iri:d.isIri.value && d.value.value
                }
              }),
            //items with copy-to-clipboard text
            copy:cd.length>0
          })
        }
    });
  }

  private copyToClipboard(item) {
    const copyFunction = (e: ClipboardEvent) => {
      e.clipboardData.setData('text/plain', (item));
      e.preventDefault();
      document.removeEventListener('copy', null);
    };
    document.addEventListener('copy', copyFunction);
    document.execCommand('copy');
    document.removeEventListener('copy', copyFunction);
    this.browserService.snackbarNotification.next([`Text "${item}" copied to clipboard.`, `info`]);
  }

  public isTreeConcept(iri:string):Observable<boolean>{
    return this.ontologyAccessService.getTreeItem$(iri).pipe(map(x => x!= undefined))
  }

  public navigateToConcept(iri:string){
    this.treeDataService.onConceptSelection(iri);
  }

  public exportOptions = {
    status: true,
    isModifier: true,
    units: true,
    codes: true,
    intent: true,
    additionalInformation: false,
    additionalInformationOnly: false
  }
  public exportOptionToggle(event: MouseEvent, option: string){
    this.exportOptions[option]=!this.exportOptions[option];
  }
  public export(){
    const iri = this.selectedIri$.getValue();
    this.exportService.get(iri, this.exportOptions, (exportString:string)=>{
      let thefile = new Blob([exportString], { type: "application/octet-stream" });
      let anchor = document.createElement('a');
  
      anchor.download = "export_"+iri+".csv";
      anchor.href = window.URL.createObjectURL(thefile);
      anchor.dataset.downloadurl = ['text/plain;charset=UTF-8', anchor.download, anchor.href].join(':');
      window.document.body.appendChild(anchor);
      anchor.click();
    });
  }

  public onSectionExpand(sectionKey:string){
    if (sectionKey == this.lastchangesdateIri) {
      this.changeDetails$ = this.selectedIri$.pipe(
        mergeMap(subject => this.commitDetailsService.getBySubject(subject)),
        mergeMap(cds => this.provenanceService.getConceptTableInformation(cds))
      );      
    }
  }
  
  ngOnDestroy() {
    this.unsubscribe.next();
    this.unsubscribe.complete();
  }
}
