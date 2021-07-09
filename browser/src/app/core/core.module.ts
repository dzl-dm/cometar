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
import { MatProgressBarModule } from '@angular/material/progress-bar'; 
import { StartComponent } from './start/start.component';
import { NoSanitizePipe } from './no-sanitize.pipe';
import { ConceptInformationComponent } from './concept-information/concept-information.component';
import { ChartsModule } from 'ng2-charts';
import { ProgressbarComponent } from './progressbar/progressbar.component';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SectionComponent } from './section/section.component';
import { TextWithNavigationComponent } from './text-with-navigation/text-with-navigation.component';
import { FormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete'; 
import { AngularResizedEventModule } from 'angular-resize-event';

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
    NoSanitizePipe,
    ConceptInformationComponent,
    ProgressbarComponent,
    SectionComponent,
    TextWithNavigationComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ChartsModule,
    MatProgressBarModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MatAutocompleteModule,
    AngularResizedEventModule
  ],
  exports: [
    TreeComponent,
    TreeItemComponent,
    TreeItemListComponent,
    BrowserComponent,
    CommonModule,
    ConceptInformationComponent,
    SectionComponent,
    TextWithNavigationComponent
  ],
  entryComponents: [
    SnackbarComponent
  ]
})
export class CoreModule { }
