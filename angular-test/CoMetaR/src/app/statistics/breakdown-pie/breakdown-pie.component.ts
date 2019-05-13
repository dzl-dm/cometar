import { Component, OnInit, Input, ElementRef, ChangeDetectionStrategy } from '@angular/core';
import Chart, { ChartData } from 'chart.js';

@Component({
  selector: 'app-breakdown-pie',
  templateUrl: './breakdown-pie.component.html',
  styleUrls: ['./breakdown-pie.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BreakdownPieComponent implements OnInit {
  @Input("") chartData: ChartData[]
  @Input("") sites: string[]
  constructor(
    private e: ElementRef,
  ) { }

  private breakdownSiteChart:Chart;
  private breakdownChart:Chart;

  ngOnInit() {
    let n: HTMLElement = this.e.nativeElement;

    let breakdownSiteCanvas = this.getNewCanvas();
    breakdownSiteCanvas.id="breakdownSiteCanvas";
    this.breakdownSiteChart = this.getNewOuterChart(breakdownSiteCanvas);
    n.getElementsByClassName("breakdownSiteChart")[0].insertBefore(breakdownSiteCanvas,n.getElementsByClassName("breakdownChart")[0]);
    let breakdownCanvas = this.getNewCanvas();
    breakdownCanvas.id="breakdownCanvas";
    this.breakdownChart = this.getNewInnerChart(breakdownCanvas);
    n.getElementsByClassName("breakdownChart")[0].appendChild(breakdownCanvas);

    this.breakdownChart.data = this.chartData[0];
    this.breakdownChart.update();
    this.breakdownSiteChart.data = this.chartData[1];
    this.breakdownSiteChart.update();
  }

  private getNewInnerChart(canvas:HTMLCanvasElement):Chart{
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, { 
      type: "doughnut",
      options: {
        responsive: true,
        cutoutPercentage: 10,
        legend: {      
          display:false
        },
        tooltips: {
          enabled: false,
          position: "custom"
        },
        onHover: (event, activeElements) => {
          let n: HTMLElement = this.e.nativeElement;
          let trs = n.getElementsByClassName("breakdownTable")[0].getElementsByTagName("tr");
          for (let i = 0; i < trs.length; i++){
            let classes=trs[i].getAttribute("class") || "";
            trs[i].setAttribute("class", classes.replace(" hovered",""));
          }
          if (activeElements && activeElements.length) {
            let index = activeElements[0]["_index"];
            let tr = <HTMLElement>n.getElementsByTagName("tr")[index+1];
            let classes=tr.getAttribute("class");
            tr.setAttribute("class",classes + " hovered");
            n.getElementsByClassName("breakdownTable")[0].parentElement.scrollTop = tr.offsetTop - 200;
          }
        },
        hover: {
          animationDuration: 0
        }
      },
      data: {}
    });
    return chart;
  }

  private getNewOuterChart(canvas:HTMLCanvasElement):Chart{
    let ctx = canvas.getContext('2d');
    let chart = new Chart(ctx, { 
      type: "doughnut",
      options: {
        responsive: true,
        cutoutPercentage: 80,
        legend: {      
          display:false
        },
        tooltips: {
          enabled: false,
          position: "custom"
        },
        onHover: (event, activeElements) => {
          let n: HTMLElement = this.e.nativeElement;
          let tds = n.getElementsByClassName("breakdownTable")[0].getElementsByTagName("td");
          for (let i = 0; i < tds.length; i++){
            let classes=tds[i].getAttribute("class") || "";
            tds[i].setAttribute("class", classes.replace(" hovered",""));
          }
          if (activeElements && activeElements.length) {
            let index = activeElements[0]["_index"];
            let td = <HTMLElement>n.getElementsByClassName("chartElement")[index];
            let classes=td.getAttribute("class");
            td.setAttribute("class",classes + " hovered");
            n.getElementsByClassName("breakdownTable")[0].parentElement.scrollTop = td.offsetTop - 200;
          }
        },
        hover: {
          intersect: true,
          animationDuration: 0
        },
      },
      data: {}
    });
    return chart;
  }

  private getNewCanvas():HTMLCanvasElement{
    let canvas = document.createElement('canvas');
    canvas.height=500;
    canvas.width=500;
    canvas.setAttribute("style","border-radius:50%; position:absolute; top:0px");
    return canvas;
  }

  private rememberBreakdownSiteIndex:number;
  private rememberBreakdownSiteColor:string;
  public tableBreakdownSiteElementHovered(a:number){
    this.rememberBreakdownSiteIndex=a;
    this.rememberBreakdownSiteColor=this.chartData[1].datasets[0].backgroundColor[a];
    this.chartData[1].datasets[0].backgroundColor[a]="rgba(50,50,50,1)";
    this.breakdownSiteChart.data = this.chartData[1];
    this.breakdownSiteChart.update();
  }
  private rememberBreakdownIndex:number;
  private rememberBreakdownColor:string;
  public tableBreakdownElementHovered(a:number){
    this.rememberBreakdownIndex=a;
    this.rememberBreakdownColor=this.chartData[0].datasets[0].backgroundColor[a];
    this.chartData[0].datasets[0].backgroundColor[a]="rgba(50,50,50,1)";
    this.breakdownChart.data = this.chartData[0];
    this.breakdownChart.update();
  }
  public dehover(){
    this.chartData[0].datasets[0].backgroundColor[this.rememberBreakdownIndex]=this.rememberBreakdownColor;
    this.breakdownChart.data = this.chartData[0];
    this.breakdownChart.update();

    this.chartData[1].datasets[0].backgroundColor[this.rememberBreakdownSiteIndex]=this.rememberBreakdownSiteColor;
    this.breakdownSiteChart.data = this.chartData[1];
    this.breakdownSiteChart.update();
  }
}
