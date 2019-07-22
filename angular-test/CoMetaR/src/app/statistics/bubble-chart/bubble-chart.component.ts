import { Component, OnInit, ElementRef, Input, ChangeDetectionStrategy } from '@angular/core';
import Chart, { ChartData, ChartOptions } from 'chart.js';

@Component({
  selector: 'app-bubble-chart',
  templateUrl: './bubble-chart.component.html',
  styleUrls: ['./bubble-chart.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BubbleChartComponent implements OnInit {
  @Input('') chartData:ChartData = {datasets:[], labels:[]};
  @Input('') phenotypes:string[];

  constructor(
    private e: ElementRef,
  ) { }
  
  private bubbleChart:Chart;

  ngOnInit() {
    let n: HTMLElement = this.e.nativeElement;

    let lineCanvas = this.getNewCanvas();
    this.bubbleChart = this.getNewChart(lineCanvas);
    n.getElementsByClassName("bubbleChart")[0].appendChild(lineCanvas);

    this.bubbleChart.data = this.chartData;
    this.bubbleChart.update();
  }
  private getNewChart(canvas:HTMLCanvasElement):Chart{
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, { 
      type: "bubble",
      options: this.bubbleChartOptions,
      data: {}
    });
    return chart;
  }
  private getNewCanvas():HTMLCanvasElement{
    let canvas = document.createElement('canvas');
    canvas.height=400;
    canvas.width=600;
    return canvas;
  }

  public bubbleChartOptions:ChartOptions = {
    responsive: true,
    elements: {
      point: {
        hitRadius: 10
      }
    },
    scales: {
      xAxes: [{
        ticks: {
          autoSkip: false,
          stepSize: 1,
          callback: (value,index)=>this.phenotypes&&this.phenotypes[index]||"placeholder"+index
        }
      }],
      yAxes: [{
        ticks: {
          autoSkip: false,
          stepSize: 1,
          callback: (value,index)=>this.phenotypes&&this.phenotypes[this.phenotypes.length-index-1]||"placeholder"+index
        }
      }]
    },
    tooltips: {
      callbacks: {
        label: (t,d) => {
          if (d.datasets[0].data[t.index]["t"]) return d.datasets[0].data[t.index]["t"].split(".");
          return ["Amount: "+Math.round(d.datasets[0].data[t.index]["r"]*30),"",this.phenotypes[t.xLabel],this.phenotypes[t.yLabel]]
        }
      },
      displayColors: false
    },
    legend: {
      display: false
    },
    hover: {
      animationDuration: 0
    }
  };
}
