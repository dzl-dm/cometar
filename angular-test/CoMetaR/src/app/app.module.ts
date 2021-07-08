import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule }    from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Location, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DetailedInformationModule } from "./detailed-information/detailed-information.module";
import { ProvenanceModule } from "./provenance/provenance.module";
import { DetailedInformationComponent } from './detailed-information/detailed-information/detailed-information.component';
import { ProvenanceComponent } from './provenance/provenance/provenance.component';
import { AppComponent } from './app/app.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSliderModule } from '@angular/material/slider';
import { CoreModule } from "./core/core.module";
import { UploadClientConfigurationModule } from './upload-client-configuration/upload-client-configuration.module';
import { UploadClientConfigurationComponent } from './upload-client-configuration/upload-client-configuration/upload-client-configuration.component';
import { BrowserComponent } from './core/browser/browser.component';
import { StartComponent } from './core/start/start.component';
import { SparqlModule } from './sparql/sparql.module';
import { SparqlComponent } from './sparql/sparql/sparql.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    DetailedInformationModule,
    CoreModule,
    ProvenanceModule,
    UploadClientConfigurationModule,
    MatSnackBarModule,
    MatSliderModule,
    SparqlModule,
    RouterModule.forRoot(
      [
        /*{ path: ':prefix/:concept', redirectTo: '/details?concept=:prefix:concept', pathMatch: 'full' },*/
        { path: '', 
          component: BrowserComponent,
          children: [            
            { path: 'details', component: DetailedInformationComponent, data: {animation: 'Details'} }, 
            { path: 'provenance', component: ProvenanceComponent, data: {animation: 'Provenance'} },    
            { path: 'client-configuration', component: UploadClientConfigurationComponent, data: {animation: 'UploadClientConfiguration'} },    
            { path: 'sparql', component: SparqlComponent, data: {animation: 'SPARQL'} },   
            { path: '**', component: StartComponent },
          ]      
        }
      ],
      {
    enableTracing: false,
    relativeLinkResolution: 'legacy'
}
    )
  ],
  providers: [ Location, {provide: LocationStrategy, useClass: HashLocationStrategy} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
