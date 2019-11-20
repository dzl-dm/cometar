import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import { ReplaySubject } from 'rxjs';
import Chart, { ChartData, ChartOptions } from 'chart.js';
import { MatTable } from '@angular/material';
import * as pluginAnnotations from 'chartjs-plugin-annotation';
import { BrowserService } from 'src/app/core/services/browser.service';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit {
  @Input('') chartData$: ReplaySubject<ChartData>;
  @Input('') chartData:ChartData = {datasets:[], labels:[]};
  @Input('') XaxeDateFormat:string = 'YYYY-M-D HH:mm:ss';
  @Input('') legend:boolean;

  constructor(
    private e: ElementRef,
    private browserService: BrowserService
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
      this.updateLastUpdateLines();
      this.lineChart.update();    
      let table = <HTMLElement>n.getElementsByClassName("col")[1];
      setTimeout(()=>table.scrollTo(table.scrollWidth,0),1000);
    });
    else if (this.chartData) {
      this.lineChart.data = this.chartData;
      this.lineChart.update();     
      let table = <HTMLElement>n.getElementsByClassName("col")[1];
      setTimeout(()=>table.scrollTo(table.scrollWidth,0),1000);
    }

    if (this.chartData$) this.chartData$.subscribe(data => {
      this.chartData = data;
    });
  }

  private updateLastUpdateLines(){
    let data = this.lineChart.data;
    (<any>this.lineChart.config.options).annotation.annotations=this.getLastUpdateLines(data);
  }
  private getLastUpdateLines(data:any){
    let alldata = <number[]>data.datasets
      .map(d => d.data)
      .reduce((result:number[],next:number[])=> result = result.concat(next),[])
      .filter((n:number) => n > 0);
    let scale = Math.max(...alldata)-Math.min(...alldata);
    let dates = data.labels.map(l => new Date(<string>l));
    let lastUpdateLines = data.datasets.map((d:any) => {
      let dateString = d.lastUpdate;
      let date = new Date(dateString);
      let color = d.borderColor;
      let earlierDates = dates.filter(x => x <= date);
      let laterDates = dates.filter(x => x >= date);
      let minIndex = 0;
      let maxIndex = dates.length-1;
      let minDate = new Date(Math.min.apply(null,dates));
      let maxDate = new Date(Math.max.apply(null,dates));
      if (earlierDates.length > 0) {
        minDate = new Date(Math.max.apply(null,earlierDates));
        minIndex = dates.map(Number).indexOf(+minDate);
      }
      if (laterDates.length > 0)
      {
        maxDate = new Date(Math.min.apply(null,laterDates));  
        maxIndex = dates.map(Number).indexOf(+maxDate);   
      }
      let minValue = 0;
      for (var i = minIndex; i < d.data.length; i++){
        if (d.data[i] > 0) {
          minValue = d.data[i];
          break;
        }
      }
      let maxValue = <number>d.data[maxIndex] || 0;
      let prop = minDate.getTime() == maxDate.getTime()?0:(date.getTime() - minDate.getTime())/(maxDate.getTime()-minDate.getTime());
      let value = Math.round(minValue+(maxValue-minValue)*prop);    
      let label = d.label      
      return this.getLastUpdateLine(dateString,color,value,scale,label)
    }).reduce((result:{}[],next:{}[])=>result = result.concat(next),[]);
    return lastUpdateLines;
  }
  private getLastUpdateLine(dateString:string,color:any,value:number,scale:number,label:string):{}[]{
    let date = new Date(dateString);
    return [
      {
        type:'box',
        drawTime: 'afterDatasetsDraw',
        borderColor:'#FFF',
        backgroundColor:color,
        borderWidth:'1',
        xScaleID: 'x-axis-0',
        yScaleID: 'y-axis-0',
        xMin: new Date(dateString).setDate(date.getDate()-5),
        xMax: new Date(dateString).setDate(date.getDate()+5),
        yMax: value+Math.max(scale/30,1),
        yMin: value-Math.max(scale/30,1),
        onClick: (e) => { 
          this.browserService.snackbarNotification.next([`Last Update of "${label}": ${dateString}.`, `info`]);
        },
      }
    ]
  }
  private getNewChart(canvas:HTMLCanvasElement):Chart{
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, { 
      type: "line",
      options: this.lineChartOptions,
      data: {},
      plugins: [pluginAnnotations]
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
      annotation: {
        events: ['click'],
        annotations: []
      },
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
            parser: this.XaxeDateFormat,
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
        mode: "point"
      },
      hover: {
        animationDuration: 0
      }
    }
  }
  public lineChartOptions: (ChartOptions & { annotation: any });
}
