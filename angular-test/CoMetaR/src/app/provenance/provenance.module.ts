import { NgModule } from '@angular/core';
import { ProvenanceComponent } from './provenance/provenance.component';
import { CommitComponent } from './commit/commit.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider'; 
import { ActivatedRoute, Router } from '@angular/router';
import { map, flatMap, filter } from 'rxjs/operators';
import { ProvenanceService } from './services/provenance.service';
import { ConfigurationService } from '../services/configuration.service';
import { GetDerivedConceptService } from './services/queries/get-derived-concept.service';
import { BrowserService } from '../core/services/browser.service';
import { GetRemovedConceptService } from './services/queries/get-removed-concept.service';

@NgModule({
  declarations: [ProvenanceComponent, CommitComponent ],
  imports: [
    CoreModule,
    FormsModule,
    MatCheckboxModule,
    MatSliderModule
  ],
  exports: [
    ProvenanceComponent
  ]
})
export class ProvenanceModule {   constructor(
  private provenanceService:ProvenanceService,
  private configurationService:ConfigurationService,
  private getDerivedConceptService:GetDerivedConceptService,
  private getRemovedConceptService:GetRemovedConceptService,
  private browserService:BrowserService,
  private router: Router,
  private route:ActivatedRoute
  ) {
    this.route.queryParamMap.pipe(
      map(data => this.configurationService.extendRdfPrefix(data.get('concept')))
    ).pipe(
      filter(iri => iri != undefined && iri != null),
      flatMap(iri => this.getDerivedConceptService.get(iri)),
      filter(derivediri => derivediri.length > 0)
    ).subscribe(data => {
      let iri = data[0]["derived_concept"].value;
      iri = this.configurationService.shortenRdfPrefix(iri);
      this.browserService.snackbarNotification.next([`You got redirected from "${location.href}".`, `info`]);
      this.router.navigate([],{queryParams: {concept: iri}, queryParamsHandling: "merge" });
    });
    this.route.queryParamMap.pipe(
      map(data => this.configurationService.extendRdfPrefix(data.get('concept')))
    ).pipe(
      filter(iri => iri != undefined && iri != null),
      flatMap(iri => this.getRemovedConceptService.get(iri)),
      filter(date => date != null)
    ).subscribe(date => {
      this.browserService.snackbarNotification.next([`This element has been deleted on "${date.toLocaleDateString()}".`, `info`]);
    });
		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => this.provenanceService.setProvenanceDate(date && new Date(date)));
}}
