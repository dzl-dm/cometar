import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule }    from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Location, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { TreeComponent } from './core/tree/tree.component';
import { TreeItemComponent } from './core/tree-item/tree-item.component';
import { TreeItemListComponent } from './core/tree-item-list/tree-item-list.component';
import { BrowserComponent } from './browser/browser.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { DetailedInformationModule } from "./detailed-information/detailed-information.module";
import { ProvenanceModule } from "./provenance/provenance.module";
import { DetailedInformationComponent } from './detailed-information/detailed-information/detailed-information.component';
import { ProvenanceComponent } from './provenance/provenance/provenance.component';
import { AppComponent } from './app/app.component';

@NgModule({
  declarations: [
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent,
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    DetailedInformationModule,
    ProvenanceModule,
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
