import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DetailedInformationComponent } from './detailed-information/detailed-information.component';
import { CoreModule } from "../core/core.module";
import { ProvenanceModule } from '../provenance/provenance.module';
import { ElementDetailsService } from './element-details.service';

@NgModule({
  declarations: [
    DetailedInformationComponent,
  ],
  imports: [
    CommonModule,
    CoreModule,
    ProvenanceModule
  ],
  exports: [
    DetailedInformationComponent
  ]
})
export class DetailedInformationModule { 
  constructor(
    private elementDetailsService:ElementDetailsService
  ){    
    this.elementDetailsService.loadStatusIcons();
  }
}
