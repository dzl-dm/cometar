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

  public neededPlaceholderSoNgModelChangeWorks;
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
      let s = this.route.queryParamMap.subscribe(data => this.router.navigate(["/"],{ queryParams: {dev: data.get('dev')}}));
      s.unsubscribe();
    }
  }
  public toggleHelp(helpDiv:HTMLElement){
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
}