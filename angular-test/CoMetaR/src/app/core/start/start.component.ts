import { Component, OnInit } from '@angular/core';
import { CommitHistoryService } from '../services/queries/commit-history.service';

@Component({
  selector: 'app-start',
  templateUrl: './start.component.html',
  styleUrls: ['./start.component.css']
})
export class StartComponent implements OnInit {
  public barChartColors: any[] = [{
    backgroundColor: 'rgba(89,179,0,0.5)',
    borderColor: 'rgba(89,179,0,1)',
    borderWidth: 2
  },{
    backgroundColor: 'rgba(255,64,25,0.5)',
    borderColor: 'rgba(255,64,25,1)',
    borderWidth: 2
  }];  
  public lineChartColors: any[] = [{
    backgroundColor: 'rgba(0,0,0,0)',
    borderColor: 'rgba(4,146,208,1)',
    pointBackgroundColor: 'rgba(4,146,208,1)',
    pointBorderColor: 'rgba(4,146,208,1)',
    pointHoverBackgroundColor: '#fff',
    pointHoverBorderColor: 'rgba(4,146,208,1)',
    borderWidth: 2
  }];
  public commitsDataset: any[] = [{
    data: [],
    label: "Additions"
  },{
    data: [],
    label: "Removals"
  }];
  public commitsLabels: any[] = [];
  public totalElementsDataset: any[] = [{
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
          },
          max: Date.now()
        },
        barThickness: 5
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
          },
          max: Date.now()
        },
        barThickness: 1
      }]
    }
  };
  constructor(
    private commitHistoryService: CommitHistoryService
  ) { }

  ngOnInit() {
    this.commitHistoryService.get().subscribe(data => {
      this.commitsLabels = data.map(d => d.date.value);
      this.commitsDataset[0]={
        data: data.map(d => d.additions.value),
        label: "Additions"
      };
      this.commitsDataset[1]={
        data: data.map(d => d.removals.value),
        label: "Removals"
      };
      let d = [];
      for (let i = data.length-1; i >= 0; i--){
        let diff = data[i].additions.value-data[i].removals.value
        if (i==data.length-1) d[i] = data[0].total.value;
        else d[i] = d[i+1]-diff;
      }
      this.totalElementsDataset[0]={
        data: d,
        label: "Total Ontology Statements"
      };
    });
  }

}
