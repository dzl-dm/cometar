import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailedInformationComponent } from './detailed-information/detailed-information.component';
import { CoreModule } from "../core/core.module";

@NgModule({
  declarations: [
    DetailedInformationComponent,
  ],
  imports: [
    CommonModule,
    CoreModule,
  ],
  exports: [
    DetailedInformationComponent
  ]
})
export class DetailedInformationModule { }
