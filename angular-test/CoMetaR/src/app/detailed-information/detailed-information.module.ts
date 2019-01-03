import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailedInformationComponent } from './detailed-information/detailed-information.component';

@NgModule({
  declarations: [DetailedInformationComponent],
  imports: [
    CommonModule
  ],
  exports: [
    DetailedInformationComponent
  ]
})
export class DetailedInformationModule { }
