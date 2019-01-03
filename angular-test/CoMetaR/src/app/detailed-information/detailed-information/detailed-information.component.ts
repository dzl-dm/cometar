import { Component, OnInit } from '@angular/core';
import { ElementDetailsService, OntologyElementDetails } from "../../services/queries/element-details.service";
import { ActivatedRoute } from '@angular/router';
import { UrlService } from 'src/app/services/url.service';
import { map, flatMap } from 'rxjs/operators';
import { ReplaySubject, BehaviorSubject } from 'rxjs';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
  selector: 'app-detailed-information',
  templateUrl: './detailed-information.component.html',
  styleUrls: ['./detailed-information.component.css']
})
export class DetailedInformationComponent implements OnInit {
  private coreDetails = {};
  private additionalDetails = {};
  private coreDetailsSelectArray = ["label", "altlabel", "notation", "unit", "status", "domain"];
  private copySelectArray = ["notation"];
  private selectedIri$:BehaviorSubject<string> = new BehaviorSubject("");
  constructor(
    private elementDetailsService:ElementDetailsService,
    private route:ActivatedRoute,
    private urlService:UrlService,
    private configuration:ConfigurationService
  ) { }

  ngOnInit() {
    this.route.queryParamMap.pipe(
      map(data => this.urlService.extendRdfPrefix(data.get('concept')))
    ).subscribe(this.selectedIri$);
    this.selectedIri$.pipe(
      flatMap(iri => this.elementDetailsService.get(iri))
    ).subscribe(data => {
      //merging details
      this.coreDetails={};
      this.additionalDetails={};
      data.forEach((detail:OntologyElementDetails) => {
        detail = this.configuration.getHumanReadableElementDetails(detail);
        Object.keys(detail).forEach(key => {
          if (key == "type") return;
          let details = this.coreDetailsSelectArray.includes(key)?this.coreDetails:this.additionalDetails;
          details[key] = details[key]||{name:detail[key].name,values:[],copy:this.copySelectArray.includes(key)};
          if (detail[key].value){
            let value = "";
            if (detail[key]["xml:lang"]) value += detail[key]["xml:lang"].toUpperCase() + ": ";
            value += detail[key].value;
            if (details[key].values.indexOf(value)==-1) details[key].values.push(value);
          }
        })
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
  }

}
