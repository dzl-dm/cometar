import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { StatisticsComponent } from './statistics/statistics.component';
import { ChartsModule } from 'ng2-charts';
import { BreakdownPieComponent } from './breakdown-pie/breakdown-pie.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [
    StatisticsComponent,
    BreakdownPieComponent,
    LineChartComponent,
    BubbleChartComponent
  ],
  imports: [
    CoreModule,
    CommonModule,
    ChartsModule,
    MatTableModule,
    MatTabsModule
  ],
  exports: [
    StatisticsComponent
  ]
})
export class StatisticsModule { }
