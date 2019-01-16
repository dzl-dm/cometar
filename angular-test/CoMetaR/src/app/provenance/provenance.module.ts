import { NgModule } from '@angular/core';
import { ProvenanceComponent } from './provenance/provenance.component';
import { CommitComponent } from './commit/commit.component';
import { CommitDetailsComponent } from './commit-details/commit-details.component';
import { CoreModule } from '../core/core.module';
import { FormsModule } from '@angular/forms';
import {MatCheckboxModule} from '@angular/material/checkbox';

@NgModule({
  declarations: [ProvenanceComponent, CommitComponent, CommitDetailsComponent],
  imports: [
    CoreModule,
    FormsModule,
    MatCheckboxModule
  ],
  exports: [
    ProvenanceComponent
  ]
})
export class ProvenanceModule { }
