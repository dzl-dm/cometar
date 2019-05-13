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

  public getDataSourcesData():ChartData{
    this.resetColors();
    let mappings:DataSourceMapping[] = Object.keys(mapping).map(key => mapping[key]).filter(m => m["first import"] != undefined).map(m => {
      if (typeof m["first import"] == "string") {
        let d = m["first import"];
        m["first import"] = d.split(".")[2]+"-"+d.split(".")[1]+"-"+d.split(".")[0];
      }
      else if (Array.isArray(m["first import"])) m["first import"] = m["first import"].map(f => f.split(".")[2]+"-"+f.split(".")[1]+"-"+f.split(".")[0]);
      return m;
    });

    let labels = mappings.map(m => {
      if (typeof m["first import"] == "string") return [ m["first import"] ];
      else if (Array.isArray(m["first import"])) return m["first import"];
    }).reduce((result, next) => result.concat(next),[]).filter(this.distinctFilter).sort();

    let datasets: ChartDataSets[] = this.qpfddSites.map(site => { return {
      label: site,
      data: labels.map(l => mappings.reduce((sum,m) => {
        if (m.site != site) return sum;
        if (typeof m["first import"] == "string" && m["first import"] == l) return sum+1;
        else if (Array.isArray(m["first import"])) return sum+m["first import"].filter(f => f == l).length;
        else return sum;
      }, 0)),
      backgroundColor: this.backgroundColor,
      borderColor: this.siteColors[site]
    }});
    
    datasets = datasets.map(ds => {
      (<number[]>ds.data).forEach((d, index, arr) => { 
        arr[index] = index>0 ? d+arr[index-1] : d 
      });
      return ds;
    });
    datasets.push({
      label: "Sum",
      data: labels.map((l, index) => <number>datasets.map(d => d.data[index]).reduce((sum,a)=><number>sum+<number>a,0))
    })
    return {labels, datasets}
  }

  public getQpfddCount(granularity:"total"|"site"|"source"|"location", valueOfInterest:"total patients"|"distinct facts"|"total facts", filterSite?:string):ChartData{
    this.resetColors();
    let baseArray:string[] = granularity == "source" && this.qpfddSources 
      || granularity == "site" && this.qpfddSites
      || granularity == "location" && this.qpfddLocations
      || granularity == "total" && [""];
    let datasets: ChartDataSets[] = baseArray.filter(b => {
      return !filterSite || filterSite == "all" || granularity == "total" || granularity == "site" || mapping[b] && mapping[b].site==filterSite || mapping[b.split("::")[0]] && mapping[b.split("::")[0]].site==filterSite
    }).map((group,index,all) => {
      return {
        label: granularity == "source" && (mapping[group] && mapping[group].label || "unknown")
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
  public phenotypes: string[];
  private i2b2usageJson:I2b2UsageDataSet[];

  constructor() { 
    //this.qpfddLabels = this.qpfddJson.map(d => d.date).filter((value, index, self) => self.map(d => d.substr(0,10)).indexOf(value.substr(0,10)) === index);
    this.qpfddLabels = qpfdd["data"].map(d => d.date).reverse().filter((value, index, self) => self.map(d => d.substr(0,7)).indexOf(value.substr(0,7)) === index).reverse();
    this.qpfddJson = qpfdd["data"].map(data => {
      if (mapping[data.source]["same as"] && mapping[mapping[data.source]["same as"]]) {
        data.source = mapping[data.source]["same as"];
      }
      return data;
    }).filter(data => this.qpfddLabels.includes(data.date));
    this.qpfddSources = this.qpfddJson.map(d => d.source).filter(this.distinctFilter);
    this.qpfddSites = this.qpfddJson.map(d => mapping[d.source] && mapping[d.source]["site"]).filter(this.distinctFilter);
    this.qpfddLocations = this.qpfddJson.filter(d => d.location!="").map(d => d.source+"::"+d.location).filter(this.distinctFilter);

    this.phenoJson = phenobd["data"].map(data => {
      if (mapping[data.source]["same as"] && mapping[mapping[data.source]["same as"]]) {
        data.source = mapping[data.source]["same as"];
      }
      return data;
    });;
    this.specimenJson = specimenbd["data"].map(data => {
      if (mapping[data.source]["same as"] && mapping[mapping[data.source]["same as"]]) {
        data.source = mapping[data.source]["same as"];
      }
      return data;
    });;
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
    //return 'rgba('+(Math.round(4+this.colorcount*colordiff)).toString()+',146,'+(Math.round(208-this.colorcount*colordiff)).toString()+',1)'
    let greytonePercentage = ((50*this.colorcount/colorAmount)+(this.colorcount%2==1?50:0))/100.0;
    greytonePercentage/=2;
    return 'rgba('+Math.round(4+greytonePercentage*251)+','+Math.round(146+greytonePercentage*109)+','+Math.round(208+greytonePercentage*47)+',1)'
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

export interface DataSourceMapping {
  "label": string,
  "site": string,
  "first import": string | string[]
}