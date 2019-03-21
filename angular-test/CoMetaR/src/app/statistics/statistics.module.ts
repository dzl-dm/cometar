import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../core/core.module';
import { StatisticsComponent } from './statistics/statistics.component';
import { ChartsModule } from 'ng2-charts';
import { BreakdownPieComponent } from './breakdown-pie/breakdown-pie.component';
import { LineChartComponent } from './line-chart/line-chart.component';
import { BubbleChartComponent } from './bubble-chart/bubble-chart.component';

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
    ChartsModule
  ],
  exports: [
    StatisticsComponent
  ]
})
export class StatisticsModule { }
