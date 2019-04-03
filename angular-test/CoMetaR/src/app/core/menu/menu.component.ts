import { Component, OnInit, ElementRef, Input, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import 'hammerjs';
import { MatSliderChange } from '@angular/material';
import { DataService } from 'src/app/services/data.service';
import { combineAll, combineLatest } from 'rxjs/operators';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit {
  public activeModule="provenance";
  public searchResultCount;
  public searchDivOpened=false;
  public historyDivOpened=false;
  public helpDivOpened=false;
  public historyFrom=new Date(Date.now());
  public historyFromDays:number;

  constructor(
    private router: Router,
    public treeDataService: TreeDataService,
    private route:ActivatedRoute,
    private e: ElementRef
  ) { }

  ngOnInit() {
    this.treeDataService.getSearchResultCount$().subscribe(count => {
      this.searchResultCount = count;
      this.searchDivOpened = count > 0;
    });
    this.treeDataService.historyFrom$.subscribe(next => {
      this.historyFrom = next && next != "" && new Date(next) || new Date(Date.now());
      let datediff = Date.now().valueOf()-this.historyFrom.valueOf();
      this.historyFromDays = Math.floor(datediff/1000/60/60/24);
    });
  }

  public performSearch(pattern:string){
    this.router.navigate([],{queryParams: {searchpattern: pattern}, queryParamsHandling: "merge" });
    return false;
  }
  public performHistoryChange(){
    this.router.navigate([],{queryParams: {historyfrom: this.historyFrom.getFullYear() +"-"+ (this.historyFrom.getMonth()+1)+"-"+this.historyFrom.getDate()}, queryParamsHandling: "merge" });
  }
  public clearSearch(){
    this.router.navigate([],{ queryParams: {searchpattern: null}, queryParamsHandling: "merge" });
    return false;   
  }
  public navigateModule(s:string){    
    if (s=="home") {
      this.treeDataService.addConceptInformation(of([]));
      this.router.navigate(["/"]);
    }
  }
  public toggleHelp(helpDiv:HTMLElement){
    this.selectHelpItems();
    this.alignHelpItems();
    let el = <HTMLElement>(<HTMLElement>this.e.nativeElement).getElementsByClassName("helpbutton")[0];
    let offsetLeft = this.getOffset(el).left;
    if (this.helpDivOpened){
      helpDiv.setAttribute("style","left:0px; height:100%; width:100%");
      this.helpDivOpened = !this.helpDivOpened; 
      setTimeout(()=>{helpDiv.setAttribute("style","left:"+offsetLeft+"px; height:0px; width:0px");},0); 
    }
    else {
      helpDiv.setAttribute("style","left:"+offsetLeft+"px; height:0px; width:0px");
      this.helpDivOpened = !this.helpDivOpened;    
      setTimeout(()=>{helpDiv.setAttribute("style","left:0px; height:100%; width:100%");},0);
    }
  }

  public changeHistoryFromLabel(event:MatSliderChange){
    let date = new Date(Date.now());
    date.setHours(date.getHours() - 24*event.value);
    this.historyFrom = date;
  }

  private getOffset(el:HTMLElement):{left, top}{
    let offsetLeft = 0;
    let offsetTop = 0;
    while(el){
      offsetLeft += el.offsetLeft;
      offsetTop += el.offsetTop;
      el = el.parentElement;
    }
    return {
      left: offsetLeft,
      top: offsetTop
    }
  }

  private selectHelpItems(){
    this.activeModule = this.router.url.split("?")[0].substr(1);
    this.helpItems = this.coreHelpItems;
    if (this.activeModule=="details") this.helpItems=this.helpItems.concat(this.detailsHelpItems);
    if (this.activeModule=="provenance") this.helpItems=this.helpItems.concat(this.provenanceHelpItems);
    if (this.activeModule=="client-configuration") this.helpItems=this.helpItems.concat(this.clientconfigurationHelpItems);
  }

  private alignHelpItems(){
    this.helpItems.forEach(hi => {
      if (hi.relativeTo){
        let el = <HTMLElement>window.document.getElementById(hi.relativeTo)
        let offset = this.getOffset(el);
        hi.left = hi.relativeLeft && offset.left + hi.relativeLeft || offset.left;
        hi.top = hi.relativeTop && offset.top + hi.relativeTop || offset.top;
      }
    })
  }

  public helpItems:HelpItem[] = [];
  
  private coreHelpItems:HelpItem[]=[
    {
      heading:"Home Button",
      description:["Click to return to start page."],
      width:150,
      relativeTo: "homebutton",
      relativeLeft: -100,
      relativeTop: 30
    },
    {
      heading:"Search Button",
      description:["Click to open/close search panel.", "The second button indicates the amount of search matches. Clicking clears search results."],
      relativeLeft:-70,
      relativeTop:30,
      width:150,
      relativeTo:"toggleSearch"
    },
    {
      heading:"Help Button",
      description:["Click to open/close help panel."],
      relativeLeft:-40,
      relativeTop:30,
      width:150,
      relativeTo:"helpbutton"
    },
    {
      heading:"Ontology Tree",
      description:["Navigate through the DZL ontology.","Click an item to show details."],
      relativeTo: "tree",
      relativeLeft: 30,
      relativeTop: 250
    },
    {
      heading:"Loading Indicator",
      description:["While spinning, content is loading."],
      relativeTo: "loading",
      relativeLeft: -50,
      relativeTop: -120
    },
    {
      heading:"Resize Bar",
      description:["Drag left or right to resize the ontology tree."],
      relativeTo: "treeResizeComponent",
      relativeLeft: -125,
      relativeTop: 350,
      width: 150
    }
  ];
  
  private detailsHelpItems:HelpItem[]=[
    {
      relativeTo:"detailed_information_additional",
      heading:"Concept Information and Relations",
      relativeLeft: 10,
      relativeTop: 150
    },
    {
      relativeTo:"detailed_information_core",
      heading:"Concept Core Information",
      description:["Press the icon to copy respective text to your clipboard."],
      relativeLeft: 10,
      relativeTop: 150,
      width:200
    }
  ];
  private provenanceHelpItems:HelpItem[]=[
    {
      heading:"Date",
      description:["Click to load all provenance data from this date."],
      relativeTo:"provenancedata",
      relativeLeft: 10,
      relativeTop: 250,
      width:150
    },
    {
      heading:"Single Update",
      description:[
        "Click to load all provenance data from a single update.",
        "The bar width indicates the amount of changes.",
        "Hover to see details on the update.", 
        "Dark stripes indicate changes on deprecated items."
      ],
      relativeTo:"provenancedata",
      relativeLeft: 250,
      relativeTop: 200,
      width:300
    },
    {
      heading:"Filter",
      description:[
        "Filter categories of changes that should be displayed."
      ],
      relativeTo:"provenanceoptions",
      relativeLeft: 250,
      relativeTop: 100,
      width:300
    }
  ];
  private clientconfigurationHelpItems:HelpItem[]=[];
}

interface HelpItem {
  heading:string,
  description?:string[],
  left?:number,
  top?:number,
  bottom?:number,
  right?:number,
  width?:number,
  relativeTo?: string,
  relativeLeft?: number,
  relativeTop?: number
}