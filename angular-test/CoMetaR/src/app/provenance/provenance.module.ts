import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProvenanceComponent } from './provenance/provenance.component';

@NgModule({
  declarations: [ProvenanceComponent],
  imports: [
    CommonModule
  ],
  exports: [
    ProvenanceComponent
  ]
})
export class ProvenanceModule { }
