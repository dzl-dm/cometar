import { Component, OnInit, ElementRef } from '@angular/core';
import { CommitHistoryService } from '../services/queries/commit-history.service';
import Chart, { ChartData, ChartOptions, ChartDataSets } from 'chart.js';
import { HelpVideosService, HelpMedia, HelpSection } from '../services/help-videos.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  
  private barChart:Chart;
  private lineChart:Chart;
 
  public commitsDataset: ChartDataSets[] = [{
    data: [],
    label: "Additions"
  },{
    data: [],
    label: "Removals"
  }];
  public commitsLabels: any[] = [];
  public totalElementsDataset: ChartDataSets[] = [{
    data: [],
    label: "Total Ontology Statements"
  }];
  public barChartOptions: any = {
    responsive: true,
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          parser: 'YYYY-MM-DD',
          unit: 'week',
          displayFormats: {
            day: 'D.M.YY',
            week: 'D.M.YY',
            month: 'D.M.YY'
          }
        },
        barThickness: 5,
        offset: true
      }]
    }
  };  
  public lineChartOptions: any = {
    responsive: true,
    elements: {
      line: {
        tension: 0
      },
      point: {
        radius: 2,
        hoverRadius: 5,
        hitRadius: 10
      }
    },
    scales: {
      xAxes: [{
        type: 'time',
        time: {
          parser: 'YYYY-MM-DD',
          unit: 'week',
          displayFormats: {
            day: 'D.M.YY',
            week: 'D.M.YY',
            month: 'D.M.YY'
          }
        },
        ticks: {
          max: Date.now()
        },
        barThickness: 1
      }]
    }
  };
  constructor(
    private commitHistoryService: CommitHistoryService,
    private helpVideosService: HelpVideosService,
    private configurationService: ConfigurationService,
    private e: ElementRef
  ) { }

  public randomVideo: HelpMedia = {
    heading: "",
    description: "",
    url: "",
    type: "video"
  };
  public randomSection: HelpSection = {
    heading: "",
    media:[]
  }
  ngOnInit() {
    let n: HTMLElement = this.e.nativeElement;
    //bar chart
    let barCanvas = document.createElement('canvas');
    barCanvas.height=400;
    barCanvas.width=500;
    let ctx1 = barCanvas.getContext('2d');
    this.barChart = new Chart(ctx1, { 
      type: "bar",
      options: this.barChartOptions,
      data: {}
    });
    n.getElementsByClassName("statistic")[0].appendChild(barCanvas);
    //line chart
    let lineCanvas = document.createElement('canvas');
    lineCanvas.height=400;
    lineCanvas.width=500;
    let ctx2 = lineCanvas.getContext('2d');
    this.lineChart = new Chart(ctx2, { 
      type: "line",
      options: this.lineChartOptions,
      data: {}
    });
    n.getElementsByClassName("statistic")[1].appendChild(lineCanvas);

    this.commitHistoryService.get().subscribe(data => {
      this.commitsLabels = data.map(d => d.date && d.date.value);
      this.commitsDataset[0]={
        data: data.map(d => d.additions.value),
        backgroundColor: 'rgba(89,179,0,0.5)',
        borderColor: 'rgba(89,179,0,1)',
        borderWidth: 2,
        label: "Additions"
      };
      this.commitsDataset[1]={
        data: data.map(d => d.removals.value),
        backgroundColor: 'rgba(255,64,25,0.5)',
        borderColor: 'rgba(255,64,25,1)',
        borderWidth: 2,
        label: "Removals"
      };
      this.barChart.data={
        labels: this.commitsLabels,
        datasets: this.commitsDataset
      }
      this.barChart.update();

      let d = [];
      for (let i = data.length-1; i >= 1; i--){
        let diff = data[i].additions.value-data[i].removals.value
        if (i==data.length-1) d[i] = data[0].total.value;
        d[i-1] = d[i]-diff;
      }
      this.totalElementsDataset[0]={
        data: d,
        backgroundColor: 'rgba(0,0,0,0)',
        borderColor: 'rgba(4,146,208,1)',
        pointBackgroundColor: 'rgba(4,146,208,1)',
        pointBorderColor: 'rgba(4,146,208,1)',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(4,146,208,1)',
        borderWidth: 2,
        label: "Total Ontology Statements"
      };
      
      this.lineChart.data={
        labels: this.commitsLabels,
        datasets: this.totalElementsDataset
      }
      this.lineChart.update();
    });

    let random1 = Math.floor(Math.random()*this.helpVideosService.helpSections.length);
    this.randomSection = this.helpVideosService.helpSections[random1];
    let random2 = Math.floor(Math.random()*this.randomSection.media.length);
    this.randomVideo = this.randomSection.media[random2];
  }
  public toggleHelp(){
    document.getElementById('helpbutton').click()
  }
  public devServer():boolean{
    return this.configurationService.getServer()=='dev'
  }
}
