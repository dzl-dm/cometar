import { Component, OnInit, Input, ChangeDetectionStrategy, ElementRef } from '@angular/core';
import { ConfigurationService } from 'src/app/services/configuration.service';
import { TreeDataService } from '../services/tree-data.service';
import { ResizedEvent } from 'angular-resize-event';

@Component({
  selector: 'app-concept-information',
  templateUrl: './concept-information.component.html',
  styleUrls: ['./concept-information.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConceptInformationComponent implements OnInit {
  @Input() headingDirection:string;
  @Input() data:string[][];
  @Input() hiddenHeading:boolean;
  @Input() columnWidthPercentages:number[]=[100];
  @Input() columnMinWidth?:number[];
  @Input() columnDisplayOptions?:("show"|"showAndShrink"|"hideOrGrow"|"hideOrShrink")[];
  //@Input() cellMinWidth?:number[];
  @Input() highlightTerm:string;
  @Input() collapsed:boolean;
  @Input() maxWidth?:number;
  @Input() truncateText?:boolean=false;
  @Input() conceptInformation:ConceptInformation;
  @Input() stayTruncated?:boolean = true;

  private offsetWidth = 0;

  constructor(
    private configurationService: ConfigurationService,
    private treeDataService: TreeDataService,
    private el: ElementRef
  ) { }

  ngOnInit() {
    if (this.conceptInformation && !this.data) {
      this.data = this.conceptInformation.cells;
      this.headingDirection="row";
      this.columnWidthPercentages = this.conceptInformation.columnWidthPercentages;
      this.columnMinWidth = this.conceptInformation.columnMinWidth;
      this.columnDisplayOptions = this.conceptInformation.columnDisplayOptions;
      //this.cellMinWidth = this.conceptInformation.cellMinWidth;
    }
    this.offsetWidth = (<HTMLElement>this.el.nativeElement).offsetWidth;
  }

  onResized(event: ResizedEvent) {
    this.offsetWidth = event.newWidth;
  }

  private matchArray(s:string):string[]{
    if (!s) return [""];
    if (!this.highlightTerm) return [s];
    let index = 0;
    let result:string[] = [];
    let counter = 0;
    let pattern = this.highlightTerm.replace(/[\\()^$:.+-]/g, '\\$1');
    let regex = new RegExp(pattern,"ig");
    while (index < s.length && counter < 20){
      let match = regex.exec(s);
      let newSearchIndex = match?match.index:-1;
      if (newSearchIndex > -1) {
        result.push(s.substring(index,newSearchIndex));
        result.push(s.substr(newSearchIndex,this.highlightTerm.length));
        index = newSearchIndex+this.highlightTerm.length;
      }
      else {
        result.push(s.substring(index));
        index = s.length;
      }
      counter++;
    }
    /* leads to performance issues
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
    }*/
    return result;
  }

  public isConceptIri(s:string):boolean{
    if (this.configurationService.cutPrefix(s) != s) return true;
    return false;
  }

  public navigateToConcept(iri:string){
    this.treeDataService.onConceptSelection(iri);
  }
  
  public getMinWidth(i:number, width?):string{
    if (!this.columnMinWidth) return this.columnWidthPercentages[i]+"%"; 
    /*let divWidth = width || (<HTMLElement>this.el.nativeElement).offsetWidth;
    if (this.columnWidthPercentages[i]*divWidth/100 < this.columnMinWidth[i]) return this.columnWidthPercentages[i]+"%";*/
    return this.columnMinWidth[i]+"px";
  }

  public getWidth(i:number, width?):string{
    return "auto";

    if (this.columnDisplayOptions && this.columnDisplayOptions[i]=="hideOrGrow") return "auto";
    if (this.columnDisplayOptions && this.columnMinWidth && this.columnDisplayOptions[i] == "showAndShrink"){
      let divWidth = width || (<HTMLElement>this.el.nativeElement).offsetWidth;
      if (this.columnWidthPercentages[i]*divWidth/100 > this.columnMinWidth[i]) return this.columnMinWidth[i]+"px"
    }
    return this.columnWidthPercentages[i]+"%";
  }

  private cache = {
    divWidth: 0,
    showColumn: []
  }
  public getDisplay(i:number, width?):("none"|"table-cell"){
    if (!this.truncateText) return "table-cell";
    let divWidth = width || this.offsetWidth;
    let cdo = this.columnDisplayOptions;
    if (!cdo) return "table-cell";
    if (cdo[i]=="show"||cdo[i]=="showAndShrink") return "table-cell";
    let cmw = this.columnMinWidth;
    let shownColumnWidthSum=0;

    if (this.cache.divWidth != divWidth)
    {
      cdo.forEach((o,index)=>{
        if (cmw) shownColumnWidthSum+=cmw[index];
        this.cache.showColumn[index] = shownColumnWidthSum < divWidth;
      });
      this.cache.divWidth = divWidth;
    }
    return this.cache.showColumn[i]?"table-cell":"none"
  }
  
  private mouseEventFunction;
  private cloneRemoveFunction;
  public onInformationMouseEnter(event:MouseEvent){
    if (!this.truncateText) return;
    if (this.cloneRemoveFunction) this.cloneRemoveFunction();
    let informationDiv = <HTMLElement>event.target;
    while (!(informationDiv.className.indexOf("treeItemInformation")>-1)) {
      informationDiv = <HTMLElement>informationDiv.parentNode;
    }
    let clone = <HTMLElement>informationDiv.cloneNode(true);
    let cit = <HTMLTableElement>clone.getElementsByClassName("conceptInformationTable")[0];
    let hiddenCells = 0;
    Array.from(cit.children).forEach((tr:HTMLTableRowElement) => {
      hiddenCells += Array.from(tr.children).filter((c:HTMLTableCellElement|HTMLTableHeaderCellElement)=>c.style.display=="none").length;
    })
    if (hiddenCells == 0) return;
    document.body.append(clone);
    let left = informationDiv.getBoundingClientRect().left;
    let maxWidth = Math.min(1000,window.innerWidth-left-20);
    if (informationDiv.offsetWidth > 1000){
      maxWidth = informationDiv.offsetWidth;
    }
    let maxHeight = Math.min(1500,window.innerHeight-40);
    clone.classList.add("hoveredInformationDiv");
    cit.classList.remove("truncateText");
    Array.from(cit.children).forEach((tr:HTMLTableRowElement) => {
      Array.from(tr.children).forEach((c:HTMLTableCellElement|HTMLTableHeaderCellElement,index)=>{
        c.style.width = this.getWidth(index,maxWidth);
        c.style.display = this.getDisplay(index,maxWidth);
        c.style.minWidth = this.getMinWidth(index,maxWidth);
      })
    })
    setTimeout(()=>{
      let top = Math.min(informationDiv.getBoundingClientRect().top, window.innerHeight-clone.offsetHeight-20);
      clone.setAttribute("style","left:"+left+"px;top:"+top+"px;max-height:"+maxHeight+"px;width:"+maxWidth+"px;");
    },0);
    let top = Math.min(informationDiv.getBoundingClientRect().top, window.innerHeight-clone.offsetHeight-20);
    clone.setAttribute("style","left:"+left+"px;top:"+top+"px;max-height:"+maxHeight+"px;width:"+maxWidth+"px;");
    let mouseX = event.x;
    let mouseY = event.y;
    this.cloneRemoveFunction = (event)=>{
      clone.remove();
      document.body.removeEventListener("mousemove",this.mouseEventFunction);
      document.getElementById("tree").removeEventListener("scroll",this.mouseEventFunction);
    }
    this.mouseEventFunction = (event)=>{
      if (event.type == "mousemove"){
        mouseX = event.x;
        mouseY = event.y;
      }
      if (mouseX < informationDiv.getBoundingClientRect().left || mouseX > informationDiv.getBoundingClientRect().left + informationDiv.offsetWidth 
        || mouseY < informationDiv.getBoundingClientRect().top || mouseY > informationDiv.getBoundingClientRect().top + informationDiv.offsetHeight){
        this.cloneRemoveFunction();
      }
    }
    document.body.addEventListener("mousemove",this.mouseEventFunction);
    document.getElementById("tree").addEventListener("scroll",this.mouseEventFunction);
  }
}

export interface ConceptInformation{
  concept:string,
  headings?:string[],
  cells:string[][],
  columnWidthPercentages:number[],
  columnMinWidth?:number[],
  columnDisplayOptions?:("show"|"showAndShrink"|"hideOrGrow"|"hideOrShrink")[],
  sourceId:string
}