import { NgModule } from '@angular/core';
import { ProvenanceComponent } from './provenance/provenance.component';
import { CommitComponent } from './commit/commit.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider'; 
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs/operators';
import { ProvenanceService } from './services/provenance.service';

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
  private route:ActivatedRoute
  ) {
		this.route.queryParamMap.pipe(
			map(data => data.get('provenancefrom'))
		).subscribe(date => this.provenanceService.setProvenanceDate(date && new Date(date)));
}}
