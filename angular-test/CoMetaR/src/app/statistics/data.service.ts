import { Injectable } from '@angular/core';
import qpfdd from "src/assets/data/statistics/qpfdd.json";
import specimenbd from "src/assets/data/statistics/specimenbd.json";
import phenobd from "src/assets/data/statistics/phenobd.json";
import mapping from "src/assets/data/statistics/mapping.json";
import multiphenotype from "src/assets/data/statistics/multiphenotype.json";
import i2b2usage from "src/assets/data/statistics/i2b2usage.json";
import { ChartDataSets, ChartData, ChartPoint } from 'chart.js';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private distinctFilter = (value, index, self) => {
    return self.indexOf(value) === index;
  }

  public getQpfddCount(granularity:"total"|"site"|"source"|"location", valueOfInterest:"total patients"|"distinct facts"|"total facts", filterSite?:string):ChartData{
    this.resetColors();
    let baseArray:string[] = granularity == "source" && this.qpfddSources 
      || granularity == "site" && this.qpfddSites
      || granularity == "location" && this.qpfddLocations
      || granularity == "total" && [""];
    let datasets: ChartDataSets[] = baseArray.filter(b => {
      return !filterSite || filterSite == "all" || mapping[b] && mapping[b].site==filterSite || mapping[b.split("::")[0]] && mapping[b.split("::")[0]].site==filterSite
    }).map((group,index,all) => {
      return {
        label: granularity == "source" && (mapping[this.qpfddSources[index]] && mapping[this.qpfddSources[index]].label || "unknown")
          || granularity == "location" && (mapping[group.split("::")[0]] && mapping[group.split("::")[0]].label + " " + group.split("::")[1] || "unknown")
          || granularity == "site" && group
          || granularity == "total" && "Total" ,
        data: this.qpfddLabels.map(l => {
          let granularData = this.qpfddJson.filter(d => d.date == l && (
            granularity == "source" && d.source == group 
            || granularity == "location" && d.source == group.split("::")[0] && d.location == group.split("::")[1]
            || granularity == "site" && mapping[d.source] && mapping[d.source].site == group
            || granularity == "total"
          ));
          let sum = granularData.reduce((sum, a) => sum+a[valueOfInterest], 0);
          return sum > 0 ? sum : undefined;
        }),
        backgroundColor: this.backgroundColor,
        borderColor: this.siteColors[group] || this.getNewColor(all.length)
      }
    });
    datasets.sort(this.sortDatasetsByLastValue);
    return { labels: this.qpfddLabels, datasets };
  }

  public getPhenotypeBreakdownData():ChartData[]{
    return this.getBreakdownData(this.phenoJson);
  }

  public getSpecimenBreakdownData():ChartData[]{
    return this.getBreakdownData(this.specimenJson);
  }

  private getBreakdownData(json:BreakdownDataSet[]):ChartData[]{
    let breakdownLabels = json.map(p => p.label).filter(this.distinctFilter);
    let breakdownSiteLabels = [];
    let breakdownData = [];
    let breakdownSiteData = [];
    let breakdownSiteColors = [];
    let breakdownColors = [];
    this.resetColors();
    breakdownLabels.forEach((label,index) => {
      this.qpfddSites.forEach((site,index) => {
          breakdownSiteData.push(json.filter(p => {
            return p.label == label && mapping[p.source].site == site
          }).reduce((sum, a) => sum+a["count"], 0));
          breakdownSiteLabels.push(label + " " + site);
          breakdownSiteColors.push(this.siteColors[site]);
      });
      breakdownData.push(json.filter(p => {
        return p.label == label
      }).reduce((sum, a) => sum+a["count"], 0));
      if (label == "No Phenotype" || label == "No Specimen") breakdownColors.push('rgba(255,255,255,1)');
      else breakdownColors.push(this.getNewColor(breakdownLabels.length));
    });
    return [{
      labels:breakdownLabels,
      datasets:[{
        data:breakdownData,
        borderColor: 'rgba(0,0,0,0)',
        backgroundColor: breakdownColors,
        borderWidth: 5
      }]
    },{
      labels:breakdownSiteLabels,
      datasets:[{
        data:breakdownSiteData, 
        backgroundColor: breakdownSiteColors
      }]
    }]
  }

  public getMultiPhenotypeData():ChartData{
    let multiPhenotypeData:ChartPoint[] = [];
    let percentageData1:ChartPoint[]=[];
    let percentageData2:ChartPoint[]=[];
    for (let i = 0; i < this.phenotypes.length; i++) {
      for (let j = 0; j < this.phenotypes.length; j++) {
        let phenocount = this.multiPhenotypeJson.filter(a => {
          let pts = <string[]>a["phenotypes"];
          return pts.includes(this.phenotypes[i]) && pts.includes(this.phenotypes[j]);
        }).length;
        let pbdd = this.getPhenotypeBreakdownData()[0];
        let xpbddIndex = pbdd.labels.indexOf(this.phenotypes[i]);
        let xPercentage = Math.round(phenocount / (<number>pbdd.datasets[0].data[xpbddIndex]) * 1000)/10;
        let ypbddIndex = pbdd.labels.indexOf(this.phenotypes[j]);
        let yPercentage = Math.round(phenocount / (<number>pbdd.datasets[0].data[ypbddIndex]) * 1000)/10;
        if (i==j){
          xPercentage = 100;
          yPercentage = 100;
        }
        multiPhenotypeData.push({
          x: i,
          y: j,
          r: i==j?0: Math.cbrt(phenocount)*2,
          t: phenocount+" patients. "+xPercentage.toString().replace(".",",")+"% of all "+this.phenotypes[i]+" patients. "+yPercentage.toString().replace(".",",")+"% of all "+this.phenotypes[j]+" patients."
        });
        percentageData1.push({
          x: i,
          y: j,
          r: i==j?0: xPercentage/100*Math.cbrt(phenocount)*2
        });
        percentageData2.push({
          x: i,
          y: j,
          r: i==j?0: yPercentage/100*Math.cbrt(phenocount)*2
        });
      }
    }
    return {
      labels: this.phenotypes,
      datasets:[
        {
          data: multiPhenotypeData,
          label: 'Series A',
          backgroundColor: 'rgba(4,146,208,0.5)',
          borderColor: 'rgba(4,146,208,0.8)',
          hoverBackgroundColor: 'rgba(4,146,208,0.8)',
          hoverBorderColor: 'rgba(4,146,208,1)',
        },
        {
          data: percentageData1,
          label: 'Series B',
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,1)',
          hoverBackgroundColor: 'rgba(0,0,0,0)',
          hoverBorderColor: 'rgba(0,0,0,0)',
        },
        {
          data: percentageData2,
          label: 'Series C',
          backgroundColor: 'rgba(0,0,0,0)',
          borderColor: 'rgba(0,0,0,1)',
          hoverBackgroundColor: 'rgba(0,0,0,0)',
          hoverBorderColor: 'rgba(0,0,0,0)',
        }
      ]
    }
  }

  public getI2b2UsageData():ChartData{
    let months = this.i2b2usageJson.map(i => i.month).filter(this.distinctFilter);
    months.sort((a:string,b:string)=>{
      let aDate = new Date(a);
      let bDate = new Date(b);
      if (aDate < bDate) return -1;
      if (aDate > bDate) return 1;
      return 0;
    });
    let userspermonthDataset:ChartDataSets = {
      label: "Users per Month",
      data: months.map(m => this.i2b2usageJson.filter(i => i.month == m && !this.i2b2userFilter.includes(i.user)).map(i => i.user).length),
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(63,144,191,1)'
    };
    let queriesspermonthDataset:ChartDataSets = {
      label: "Queries per Month",
      data: months.map(m => this.i2b2usageJson.filter(i => i.month == m).map(i => i.queries).reduce((sum,a)=>sum+a,0)),
      backgroundColor: 'rgba(0,0,0,0)',
      borderColor: 'rgba(38,144,66,1)'
    };
    return {
      labels: months,
      datasets:[userspermonthDataset,queriesspermonthDataset]
    }
  }

  private qpfddJson:QpfddDataSet[] = [];
  private qpfddLabels:string[];
  private qpfddSources:string[];
  public qpfddSites:string[];
  private qpfddLocations:string[];

  private phenoJson:BreakdownDataSet[]=[];
  private specimenJson:BreakdownDataSet[]=[];
  private multiPhenotypeJson=[];
  private phenotypes: string[];
  private i2b2usageJson:I2b2UsageDataSet[];

  constructor() { 
    this.qpfddJson = qpfdd["data"];
    this.qpfddLabels = this.qpfddJson.map(d => d.date).filter(this.distinctFilter);
    this.qpfddSources = this.qpfddJson.map(d => d.source).filter(this.distinctFilter);
    this.qpfddSites = this.qpfddJson.map(d => mapping[d.source]["site"]).filter(this.distinctFilter);
    this.qpfddLocations = this.qpfddJson.filter(d => d.location!="").map(d => d.source+"::"+d.location).filter(this.distinctFilter);

    this.phenoJson = phenobd["data"];
    this.specimenJson = specimenbd["data"];
    this.multiPhenotypeJson = multiphenotype["data"];
    this.phenotypes = this.multiPhenotypeJson.map(a => <string[]>a["phenotypes"]).reduce((result, subarray) => result.concat(subarray), []).filter(this.distinctFilter);
    this.i2b2usageJson = i2b2usage["data"];
  }

  private sortDatasetsByLastValue(a: ChartDataSets, b: ChartDataSets){
    let indexa = a.data.length-1;
    let indexb = b.data.length-1;
    for (let i = a.data.length-1; i >= 0 && a.data[indexa] == undefined; i--) indexa = i;
    for (let i = b.data.length-1; i >= 0 && b.data[indexb] == undefined; i--) indexb = i;
    if (a.data[indexa] < b.data[indexb]) return 1
    if (a.data[indexa] > b.data[indexb]) return -1
    return 0;
  }

  private sortBreakdown(a:BreakdownDataSet,b:BreakdownDataSet){
    if (a["count"] < b["count"]) return 1;
    else if (a["count"] > b["count"]) return -1;
    else return 0;
  }
  
  private colorcount = -1;
  private backgroundColor = 'rgba(0,0,0,0)';
  private resetColors(){
    this.colorcount=-1;
  }
  private getNewColor(colorAmount:number) {
    let colordiff = 208/colorAmount;
    this.colorcount++;
    return 'rgba('+(4+this.colorcount*colordiff).toString()+',146,'+(208-this.colorcount*colordiff).toString()+',1)'
  }
  private siteColors = {
    "ARCN": 'rgba(38,144,66,1)',
    "BREATH": 'rgba(63,144,191,1)',
    "CPCM": 'rgba(85,191,184,1)',
    "UGMLC": 'rgba(191,174,63,1)',
    "TLRC": 'rgba(191,63,63,1)'
  }
  private i2b2userFilter = ["mstoehr", "rmajeed", "GBN", "kaletsch"];
}

export interface QpfddDataSet {
  "date": string,
	"location": string,
	"total patients": number,
	"total facts": number,
	"distinct facts": number,
  "last update": string,
  "source": string
}

export interface BreakdownDataSet {
  "date": string,
  "label": string,
	"source": string,
	"count": number
}

export interface I2b2UsageDataSet {
  "month": string,
  "user": string,
  "queries": number
}