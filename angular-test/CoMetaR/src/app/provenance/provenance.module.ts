import { NgModule } from '@angular/core';
import { ProvenanceComponent } from './provenance/provenance.component';
import { CommitComponent } from './commit/commit.component';
import { CommitDetailsComponent } from './commit-details/commit-details.component';
import { CoreModule } from '../core/core.module';

@NgModule({
  declarations: [ProvenanceComponent, CommitComponent, CommitDetailsComponent],
  imports: [
    CoreModule
  ],
  exports: [
    ProvenanceComponent
  ]
})
export class ProvenanceModule { }
