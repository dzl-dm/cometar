import { Component, OnInit } from '@angular/core';
import { DataService } from '../data.service';
import { ChartData } from 'chart.js';
import { ReplaySubject } from 'rxjs';

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.css']
})
export class StatisticsComponent implements OnInit {

  ngOnInit() {
    this.updateCharts();
  }

  public statisticsPage:number = 2;
  public granularityIndex:number = 0;
  private granularities:("total"|"site"|"source"|"location")[]=["total","site","source","location"];
  public siteIndex:number = 0;
  public sites=["all"].concat(this.dataService.qpfddSites);
  public totalPatientCountData$ = new ReplaySubject<ChartData>();
  public distinctFactsCountData$ = new ReplaySubject<ChartData>();
  public totalFactsCountData$ = new ReplaySubject<ChartData>();

  public phenotypeBreakdownData:ChartData[];
  public specimenBreakdownData:ChartData[];
  public multiPhenotypeData:ChartData;
  public i2b2usageData:ChartData;
  public dataSourcesData:ChartData;

  public changeGranularity(event){
    this.granularityIndex = event["index"];
    this.updateCharts();
  }
  public changeSite(event){
    this.siteIndex = event["index"];
    this.updateCharts();
  }
  private updateCharts(){
    this.totalPatientCountData$.next(this.dataService.getQpfddCount(this.granularities[this.granularityIndex],"total patients",this.sites[this.siteIndex]));
    this.distinctFactsCountData$.next(this.dataService.getQpfddCount(this.granularities[this.granularityIndex],"distinct facts",this.sites[this.siteIndex]));
    this.totalFactsCountData$.next(this.dataService.getQpfddCount(this.granularities[this.granularityIndex],"total facts",this.sites[this.siteIndex]));

    this.i2b2usageData = this.dataService.getI2b2UsageData();
    this.dataSourcesData = this.dataService.getDataSourcesData();

    this.phenotypeBreakdownData = this.dataService.getPhenotypeBreakdownData();
    this.specimenBreakdownData = this.dataService.getSpecimenBreakdownData();
    this.multiPhenotypeData = this.dataService.getMultiPhenotypeData();
  }

  constructor(
    public dataService: DataService
  ) { }
}