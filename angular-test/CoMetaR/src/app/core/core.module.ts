import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TreeComponent } from './tree/tree.component';
import { TreeItemComponent } from './tree-item/tree-item.component';
import { TreeItemListComponent } from './tree-item-list/tree-item-list.component';
import { BrowserComponent } from './browser/browser.component';
import { RouterModule, Routes } from '@angular/router';
import { LogosComponent } from './logos/logos.component';
import { MenuComponent } from './menu/menu.component';
import { SnackbarComponent } from './snackbar/snackbar.component';
import { StartComponent } from './start/start.component';
import { NoSanitizePipe } from './no-sanitize.pipe';

@NgModule({
  declarations: [
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent,
    LogosComponent,
    MenuComponent,
    SnackbarComponent,
    StartComponent,
    NoSanitizePipe
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
  ],
  entryComponents: [
    SnackbarComponent
  ]
})
export class CoreModule { }
