import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule }    from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { Location, LocationStrategy, HashLocationStrategy } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { TreeComponent } from './tree/tree.component';
import { TreeItemComponent } from './tree-item/tree-item.component';
import { TreeItemListComponent } from './tree-item-list/tree-item-list.component';
import { BrowserComponent } from './browser/browser.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@NgModule({
  declarations: [
    AppComponent,
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(
      [
        { path: ':prefix/:concept', component: BrowserComponent },
        { path: '**', component: BrowserComponent }
      ],
      { enableTracing: false } // <-- debugging purposes only
    )
  ],
  providers: [ Location, {provide: LocationStrategy, useClass: HashLocationStrategy} ],
  bootstrap: [AppComponent]
})
export class AppModule { }
