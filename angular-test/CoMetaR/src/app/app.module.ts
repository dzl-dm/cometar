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
import { MatSnackBarModule } from '@angular/material';
import { CoreModule } from "./core/core.module";
import { BrowserComponent } from './browser/browser.component';

@NgModule({
  declarations: [
    AppComponent,
    BrowserComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    DetailedInformationModule,
    CoreModule,
    ProvenanceModule,
    MatSnackBarModule,
    RouterModule.forRoot(
      [
        { path: ':prefix/:concept', redirectTo: 'details?concept=:prefix::concept' },
        { path: '', 
          component: BrowserComponent,
          children: [            
            { path: 'details', component: DetailedInformationComponent, data: {animation: 'Details'} }, 
            { path: 'provenance', component: ProvenanceComponent, data: {animation: 'Provenance'} },    
            { path: '**', component: ProvenanceComponent, data: {animation: 'Provenance'} },
          ]      
        }
      ],
      { enableTracing: false } // <-- debugging purposes only
    )
  ],
  providers: [ Location, {provide: LocationStrategy, useClass: HashLocationStrategy} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
