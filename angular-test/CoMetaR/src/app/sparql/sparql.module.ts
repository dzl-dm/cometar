import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SparqlComponent } from './sparql/sparql.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [SparqlComponent],
  imports: [
    CommonModule,
    FormsModule
  ],
  exports: [
    SparqlComponent
  ]
})
export class SparqlModule { }
