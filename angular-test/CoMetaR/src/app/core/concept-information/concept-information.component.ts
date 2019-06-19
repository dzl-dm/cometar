import { Component, OnInit, Input, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { TreeDataService } from '../services/tree-data.service';

@Component({
  selector: 'app-concept-information',
  templateUrl: './concept-information.component.html',
  styleUrls: ['./concept-information.component.css']
})
export class ConceptInformationComponent implements OnInit {
  @Input() headingDirection:string;
  @Input() data:string[][];
  @Input() hiddenHeading:boolean;
  @Input() cellWidthPercentages:number[];
  @Input() cellMaxWidth?:number[];
  @Input() cellMinWidth?:number[];
  @Input() highlightTerm:string;
  @Input() collapsed:boolean;
  @Input() maxWidth?:number;
  @Input() truncateText?:boolean;
  @Input() conceptInformation:ConceptInformation;
  constructor(
    private configurationService: ConfigurationService,
    private treeDataService: TreeDataService,
    private el: ElementRef
  ) { }

  ngOnInit() {
    if (this.conceptInformation && !this.data) {
      this.data = this.conceptInformation.cells;
      this.headingDirection="row";
      this.cellWidthPercentages = this.conceptInformation.cellWidthPercentages;
      this.cellMaxWidth = this.conceptInformation.cellMaxWidth;
      this.cellMinWidth = this.conceptInformation.cellMinWidth;
    }
  }

  private matchArray(s:string):string[]{
    if (!s) return [""];
    let index = 0;
    let result:string[] = [];
    let counter = 0;
    while (index < s.length && counter < 20){
      let newSearchIndex = this.highlightTerm && s.toUpperCase().indexOf(this.highlightTerm.toUpperCase(),index) || -1;
      let newLinkIndex = -1;
      Object.keys(this.configurationService.getRdfPrefixMap).forEach((key)=>{
        let tempLinkIndex = s.toUpperCase().indexOf(key.toUpperCase(),index);
        newLinkIndex = newLinkIndex != -1 && tempLinkIndex != -1 && Math.min(newLinkIndex,tempLinkIndex)
          || newLinkIndex != -1 && tempLinkIndex
          || tempLinkIndex != -1 && newLinkIndex
      })
      if (newSearchIndex > -1 && (newLinkIndex == -1 || newSearchIndex < newLinkIndex)) {
        result.push(s.substring(index,newSearchIndex));
        result.push(s.substr(newSearchIndex,this.highlightTerm.length));
        index = newSearchIndex+this.highlightTerm.length;
      }
      else if (newLinkIndex > -1) {
        let link = s.substring(newLinkIndex,s.indexOf(" ",newLinkIndex));
        result.push(s.substring(index, newLinkIndex));
        result.push(s.substr(newLinkIndex,link.length));
        index = newLinkIndex+link.length;
      }
      else {
        result.push(s.substring(index));
        index = s.length;
      }
      counter++;
    }
    return result;
  }

  public isConceptIri(s:string):boolean{
    if (this.configurationService.cutPrefix(s) != s) return true;
    return false;
  }

  public navigateToConcept(iri:string){
    this.treeDataService.onConceptSelection(iri);
  }

  public getWidth(i:number):string{
    let percentValue = this.cellWidthPercentages[i];
    let maxValue = this.cellMaxWidth && this.cellMaxWidth[i];
    let minValue = this.cellMinWidth && this.cellMinWidth[i];
    let minvaluesum = this.cellMinWidth && this.cellMinWidth.reduce((previous,current,index)=>previous+current) || 0;
    let divWidth = (<HTMLElement>this.el.nativeElement).offsetWidth;
    if (divWidth > minvaluesum && minValue > 0 && percentValue*divWidth/100 < minValue) return minValue+"px";
    if (maxValue > 0 && percentValue*divWidth/100 > maxValue) return maxValue+"px";
    else return percentValue + "%";
  }
}

export interface ConceptInformation{
  concept:string,
  headings?:string[],
  cells:string[][],
  cellWidthPercentages:number[],
  cellMaxWidth?:number[],
  cellMinWidth?:number[],
  sourceId:string
}