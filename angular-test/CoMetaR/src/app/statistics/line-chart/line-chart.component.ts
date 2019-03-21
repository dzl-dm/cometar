import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import Chart, { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {
  @Input('') chartData$: ReplaySubject<ChartData>;
  @Input('') chartData:ChartData;
  @Input('') XaxeDateFormat:string;
  @Input('') legend:boolean;

  constructor(
    private e: ElementRef,
  ) { }

  private lineChart:Chart;

  ngOnInit() {
    let n: HTMLElement = this.e.nativeElement;

    let lineCanvas = this.getNewCanvas();
    this.setLineChartOptions();
    this.lineChart = this.getNewChart(lineCanvas);
    n.getElementsByClassName("lineChart")[0].appendChild(lineCanvas);

    if (this.chartData$) this.chartData$.subscribe(data => {
      this.lineChart.data = data;
      this.lineChart.update();
    });
    else if (this.chartData) {
      this.lineChart.data = this.chartData;
      this.lineChart.update();     
    }
  }

  private getNewChart(canvas:HTMLCanvasElement):Chart{
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, { 
      type: "line",
      options: this.lineChartOptions,
      data: {}
    });
    return chart;
  }
  private getNewCanvas():HTMLCanvasElement{
    let canvas = document.createElement('canvas');
    canvas.height=400;
    canvas.width=500;
    return canvas;
  }

  public getDateLabel(label:string){
    return new Date(label).toLocaleDateString();
  }

  private setLineChartOptions() {
    this.lineChartOptions = {
      responsive: true,
      elements: {
        line: {
          tension: 0
        }
      },
      scales: {
        xAxes: [{
          type: 'time',
          time: {
            parser: this.XaxeDateFormat || 'YYYY-M-D HH:mm:ss',
            displayFormats: {
              day: 'MMM YYYY'
            }
          }
        }]
      },
      legend: {
        display: this.legend || false
      },
      tooltips: {
        mode: "index"
      }
    }
  }
  public lineChartOptions: ChartOptions;
}
