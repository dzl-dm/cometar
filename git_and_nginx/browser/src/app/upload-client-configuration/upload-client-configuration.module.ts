import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadClientConfigurationComponent } from './upload-client-configuration/upload-client-configuration.component';
import { FormsModule } from '@angular/forms';
import { CoreModule } from '../core/core.module';

@NgModule({
  declarations: [UploadClientConfigurationComponent],
  imports: [
    FormsModule,
    CoreModule,
    CommonModule
  ]
})
export class UploadClientConfigurationModule {
  constructor(
  ) {
  }
}
