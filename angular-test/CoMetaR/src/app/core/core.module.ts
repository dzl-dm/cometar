import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeComponent } from './tree/tree.component';
import { TreeItemComponent } from './tree-item/tree-item.component';
import { TreeItemListComponent } from './tree-item-list/tree-item-list.component';
import { BrowserComponent } from '../browser/browser.component';
import { RouterModule, Routes } from '@angular/router';
import { LogosComponent } from './logos/logos.component';

@NgModule({
  declarations: [
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent,
    LogosComponent
  ],
  imports: [
    CommonModule,
    RouterModule
  ],
  exports: [
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent,
    CommonModule
  ]
})
export class CoreModule { }
