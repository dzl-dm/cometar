import { Component, OnInit, ElementRef, Input, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { TreeDataService } from '../services/tree-data.service';
import { Router, ActivatedRoute } from '@angular/router';
import { of, Observable } from 'rxjs';
import 'hammerjs';
import { MatSliderChange, MatIconRegistry } from '@angular/material';
import { DataService } from 'src/app/services/data.service';
import { combineAll, combineLatest } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { TreeStyleService } from '../services/tree-style.service';
import { HelpVideosService } from '../services/help-videos.service';
import { SearchSuggestionService } from '../services/queries/search-suggestion.service';

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

  constructor(
    private router: Router,
    public treeDataService: TreeDataService,
    public treeStyleService: TreeStyleService,
    public helpVideosService: HelpVideosService,
    private searchSuggestionService: SearchSuggestionService,
    private route:ActivatedRoute,
    private e: ElementRef,
    private cd: ChangeDetectorRef,
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer
  ) { 
    iconRegistry.addSvgIcon('home', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-home-24px.svg'));
    iconRegistry.addSvgIcon('search', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-search-24px.svg'));
    iconRegistry.addSvgIcon('help', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-help_outline-24px.svg'));
  }

  ngOnInit() {
    this.treeDataService.getSearchResultCount$().subscribe(count => {
      this.searchResultCount = count;
      this.cd.detectChanges();
    });
    this.searchDivOpened = this.treeDataService.getSearchPattern() && this.treeDataService.getSearchPattern() != "";
  }

  options=[];
  public searchPatternChanged(pattern:string){
    this.searchSuggestionService.get(pattern).subscribe(data => {
      if (data.length > 0 && data[0].match) {
        let result = []
        data.map(d => d.match.value).forEach(m => {
          let firstWord = m.split(" ")[0];
          if (!result.includes(firstWord)) result.push(firstWord);
          if (m != firstWord) result.push(m);
        })
        this.options = result;
      }
      this.cd.markForCheck();
    });
  }
  public performSearch(pattern:string){
    this.router.navigate([],{queryParams: {searchpattern: pattern}, queryParamsHandling: "merge" });
    return false;
  }
  public clearSearch(){
    this.router.navigate([],{ queryParams: {searchpattern: null}, queryParamsHandling: "merge" });
    return false;   
  }
  public navigateModule(s:string){    
    if (s=="home") {
      this.treeDataService.reset();
      //this.treeStyleService.reset();
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
        hi.left = Math.max(0,hi.relativeLeft && offset.left + hi.relativeLeft || offset.left);
        hi.top = Math.max(0,hi.relativeTop && offset.top + hi.relativeTop || offset.top);
      }
    })
  }

  public onSectionHeadingClick(event:MouseEvent, sectionWrapper:HTMLElement){
    console.log(sectionWrapper);
    sectionWrapper.scrollTop=50
  }

  public helpItems:HelpItem[] = [];
  
  private coreHelpItems:HelpItem[]=[
    {
      heading:"Home Button",
      description:["Click to return to start page."],
      width:150,
      relativeTo: "homebutton",
      relativeLeft:0,
      relativeTop: 30
    },
    {
      heading:"Search Button",
      description:["Click to open/close search panel.", "The second button indicates the amount of search matches. Clicking clears search results."],
      relativeLeft:0,
      relativeTop:35,
      width:150,
      relativeTo:"toggleSearch"
    },
    {
      heading:"Help Button",
      description:["Click to open/close help panel."],
      relativeLeft:0,
      relativeTop:45,
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