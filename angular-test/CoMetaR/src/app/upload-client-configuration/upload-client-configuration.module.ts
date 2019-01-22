import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadClientConfigurationComponent } from './upload-client-configuration/upload-client-configuration.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [UploadClientConfigurationComponent],
  imports: [
    FormsModule,
    CommonModule
  ]
})
export class UploadClientConfigurationModule { }
