import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-concept-information',
  templateUrl: './concept-information.component.html',
  styleUrls: ['./concept-information.component.css']
})
export class ConceptInformationComponent implements OnInit {
  @Input() headingDirection:string;
  @Input() data:string[][];
  @Input() hiddenHeading:boolean;
  @Input() cellWidthPercentages;
  @Input() highlightTerm:string;
  @Input() conceptInformation:ConceptInformation
  constructor() { }

  ngOnInit() {
    if (this.conceptInformation) {
      this.conceptInformation.cells.splice(0,0,this.conceptInformation.headings);
      this.data = this.conceptInformation.cells;
      this.headingDirection="row";
      this.cellWidthPercentages = this.conceptInformation.cellWidthPercentages;
    }
  }

  private searchMatchArray(s:string):string[]{
    if (this.highlightTerm == undefined) return [s];
    let index = 0;
    let result:string[] = [];
    let counter = 0;
    while (index < s.length && counter < 10){
      let newindex = s.toUpperCase().indexOf(this.highlightTerm.toUpperCase(),index);
      if (newindex > -1) {
        result.push(s.substring(index,newindex));
        result.push(s.substr(newindex,this.highlightTerm.length));
        index = newindex+this.highlightTerm.length;
      }
      else {
        result.push(s.substring(index));
        index = s.length;
      }
      counter++;
    }
    return result;
  }
}

export interface ConceptInformation{
  concept:string,
  headings?:string[],
  cells:string[][],
  cellWidthPercentages:number[],
  cellWidthPixels?:number[],
  sourceId:string
}