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
    this.selectGranularity(this.granularity);
  }

  public whichStatistics:"counts"|"breakdowns"="breakdowns";
  public granularity:"total"|"site"|"source"|"location"="site";
  public selectedSite="all";
  public totalPatientCountData$ = new ReplaySubject<ChartData>();
  public distinctFactsCountData$ = new ReplaySubject<ChartData>();
  public totalFactsCountData$ = new ReplaySubject<ChartData>();

  public phenotypeBreakdownData:ChartData[];
  public specimenBreakdownData:ChartData[];
  public multiPhenotypeData:ChartData;
  public i2b2usageData:ChartData;

  public selectGranularity(g:"total"|"site"|"source"|"location"){
    this.granularity = g;
    this.updateCharts();
  }
  public selectSite(s:string){
    this.selectedSite = s;
    this.updateCharts();
  }
  private updateCharts(){
    this.totalPatientCountData$.next(this.dataService.getQpfddCount(this.granularity,"total patients",this.selectedSite));
    this.distinctFactsCountData$.next(this.dataService.getQpfddCount(this.granularity,"distinct facts",this.selectedSite));
    this.totalFactsCountData$.next(this.dataService.getQpfddCount(this.granularity,"total facts",this.selectedSite));

    this.i2b2usageData = this.dataService.getI2b2UsageData();

    this.phenotypeBreakdownData = this.dataService.getPhenotypeBreakdownData();
    this.specimenBreakdownData = this.dataService.getSpecimenBreakdownData();
    this.multiPhenotypeData = this.dataService.getMultiPhenotypeData();
  }

  constructor(
    private dataService: DataService
  ) { }
}