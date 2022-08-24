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
        offset: true
      }]
    },
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
        }
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
  public getConfig(){
    return this.configurationService.settings
  }
}
