import { Injectable, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable, BehaviorSubject, combineLatest, of, ReplaySubject } from 'rxjs';
import { map, filter, flatMap, first, startWith } from 'rxjs/operators';
//import html2canvas from 'html2canvas';
//import { WebWorkerService } from 'ngx-web-worker';
import { BrowserService } from './browser.service';
import { OntologyAccessService } from './ontology-access.service';

@Injectable({
  providedIn: 'root'
})
export class TreeStyleService {

  constructor(
    private ontologyAccessService: OntologyAccessService,
    private browserService: BrowserService
  ) { 
  }

  private treeDomElement:HTMLElement;
  public registerTreeDomElement(el:HTMLElement){
    Array.from(el.children).forEach((child:HTMLElement) => {
      if (child.getAttribute('id') == "tree") {
        this.treeDomElement = child;
      }
    });
    this.browserService.resizeSubject.subscribe(()=>this.onTreeDomChange("Browser resize."));
  }
  /**
   * right now only return a number for the information div intent as Observable
   * @param el 
   */

  private getPosition(el:HTMLElement) {
    if (!el) return;
    let xPos = 0;
    let yPos = 0;
    while (el != this.treeDomElement && el != undefined) {
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      el = <HTMLElement> el.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
  }
  private getTreeItemByIri(iri:string):HTMLElement[]{
    let treeItems = Array.from(this.treeDomElement.getElementsByTagName("APP-TREE-ITEM"));
    let iriTreeItems = <HTMLElement[]>treeItems.filter(ti => ti.getAttribute("iri")==iri);
    return iriTreeItems;
  }


  public outlineElements$ = new Subject<{}[]>();
  private observer:MutationObserver;
  private domChangeTimeout;
  public onTreeDomChange(caller:string){
    //console.log(caller);
    if (this.domChangeTimeout != undefined){
      clearTimeout(this.domChangeTimeout);
    }
    this.domChangeTimeout = setTimeout(()=>this.setOutlineElements(),0);
  }
  private setOutlineElements(){
    //console.log("Outline Elements refresh.");
    /*html2canvas(<HTMLElement>(<HTMLElement>this.treeDomElement).getElementsByTagName("app-tree-item-list")[0],{
    }).then(function(canvas) {
      canvas.setAttribute("style","width:100;height:100%");
      (<HTMLElement>document.getElementById("test")).innerHTML = "";
      (<HTMLElement>document.getElementById("test")).append(canvas);
    });*/

    let outlineElements = [];
    let treeItems = Array.from(this.treeDomElement.getElementsByTagName("APP-TREE-ITEM"));
    treeItems.forEach((ti:HTMLElement) => {
      let iri = ti.getAttribute("iri");
      let listheight = (<HTMLElement>this.treeDomElement.getElementsByTagName("app-tree-item-list")[0]).offsetHeight;
      let relativetop = this.getPosition(ti).y/listheight;
      let relativeheight = ti.offsetHeight/listheight;
      let tiInformation = Array.from(ti.childNodes).filter((cn:HTMLElement)=>cn.classList && cn.classList.contains("treeItemInformation"));
      if (ti.className.indexOf("selected")>-1) {
        outlineElements.push({
          top:relativetop,
          bordercolor:"#BFE3F2",
          siblings:1,
          position:0,
          height:relativeheight,
          concept: iri
        })
      }
      if (tiInformation.length>0){
        let relativeinfotop = this.getPosition(<HTMLElement>tiInformation[0]).y/listheight;
        let relativeinfoheight = (<HTMLElement>tiInformation[0]).offsetHeight/listheight;
        outlineElements.push({
          top:relativeinfotop,
          color:"#FFFBD5",
          bordercolor:"#777",
          siblings:1,
          position:0,
          height:relativeinfoheight,
          concept: iri
        })
      }
      this.getTreeItemStyle$(iri).subscribe(style => {
        this.getIcons(style).filter(i => {
          if (i["background-color"] && i["background-color"] == "white") return false;
          let realicon = style.icons.includes(i);  
          if (realicon) return true;   
          let tiexpanded = (<HTMLElement>ti.getElementsByClassName("treeItemExpand")[0]).getAttribute("class").indexOf("expanded")>-1;
          if (tiexpanded) return false;
          return true;
        }).forEach((value, index, array) => {   
          let title = (<HTMLElement>ti.getElementsByClassName("treeItemTitle")[0]);
          let relativetitleheight = title.offsetHeight/listheight;
          outlineElements.push({
            top: relativetop,
            color: value["background-color"],
            siblings: array.length,
            position: index,
            height:relativetitleheight,
            concept: iri
          })
        })
      })
    });
    this.outlineElements$.next(outlineElements);
  }

  public scrollHeadingsSubject$ = new Subject<string[]>();
  public onTreeScroll(scrollTop:number){
    let scrollHeadings:string[]=[];   
    let visibleListItem:HTMLElement = this.treeDomElement;
    let foundChild = true;
    let adjustedScrollTop = scrollTop-5;
    while (foundChild){
      foundChild=false;
      let childlist = this.getList(visibleListItem);
      if (childlist) Array.from(this.getListItems(childlist)).forEach((childlistitem:HTMLElement) => {
        if (foundChild)return;
        if (this.getPosition(childlistitem).y < adjustedScrollTop && childlistitem.offsetHeight+this.getPosition(childlistitem).y-this.getTitle(childlistitem).offsetHeight > adjustedScrollTop){
          visibleListItem = childlistitem;
          scrollHeadings.push(this.getTitle(visibleListItem).innerHTML);
          adjustedScrollTop+=this.getTitle(childlistitem).offsetHeight-10;
          foundChild=true;
        }
      });
    }
    this.scrollHeadingsSubject$.next(scrollHeadings);
  }
  public getTopVisibleChild():HTMLElement{
    let visibleListItem:HTMLElement = this.treeDomElement;
    let foundChild = true;
    let adjustedScrollTop = this.treeDomElement.scrollTop-5;
    while (foundChild){
      foundChild=false;
      let childlist = this.getList(visibleListItem);
      if (childlist) Array.from(this.getListItems(childlist)).forEach((childlistitem:HTMLElement) => {
        if (foundChild)return;
        if (this.getPosition(childlistitem).y < adjustedScrollTop && childlistitem.offsetHeight+this.getPosition(childlistitem).y-this.getTitle(childlistitem).offsetHeight > adjustedScrollTop){
          visibleListItem = childlistitem;
          adjustedScrollTop+=this.getTitle(childlistitem).offsetHeight-10;
          foundChild=true;
        }
      });
    }
    return visibleListItem;
  }
  private getList(listitem:HTMLElement):HTMLElement{
    let list:HTMLElement;
    Array.from(listitem.children).forEach((child:HTMLElement) => {
      if (child.tagName == "APP-TREE-ITEM-LIST") list = child;
    });
    return list;
  }
  private getListItems(list:HTMLElement):HTMLCollection{
    return list.children;
  }
  private getTitle(listitem:HTMLElement):HTMLElement{
    return <HTMLElement>listitem.getElementsByClassName("treeItemHeading")[0].getElementsByClassName("treeItemTitle")[0];
  }

  private informationDivMaxParents$ = new BehaviorSubject<number>(0);
  private maxintent = 0;
  public getIntent(el:HTMLElement):Observable<number>{
    let p = el.parentElement;
    let counter = 0;
    while (p){
      if (p.tagName == "APP-TREE-ITEM") counter++;
      p = p.parentElement
    }
    if (counter > this.maxintent){
      this.maxintent=counter;
      this.informationDivMaxParents$.next(counter);
    }
    return this.informationDivMaxParents$.pipe(map(mi => mi-counter));
  }

  public getEmptyStyle(iri:string):TreeItemStyle {
    return { concept:iri, icons: [] }
  }

  private allTreeItemStyles$:BehaviorSubject<Observable<TreeItemStyle[]>[]> = new BehaviorSubject<Observable<TreeItemStyle[]>[]>([]);
  private treeItemStyles$:Observable<TreeItemStyle[]> = this.allTreeItemStyles$.pipe(flatMap(styles => combineLatest(styles).pipe(
    map(s => s.reduce((result,next)=>result=result.concat(next),[]))
  )));
  public addTreeItemStyles(styles$:Observable<TreeItemStyle[]>){
    let s:Observable<TreeItemStyle[]>[];
    this.allTreeItemStyles$.subscribe(d => s = d).unsubscribe();
    this.allTreeItemStyles$.next(s.concat(styles$.pipe(startWith([]))));
  }
  public getTreeItemStyle$(iri:string):Observable<TreeItemStyle> {
    return combineLatest(this.treeItemStyles$,this.ontologyAccessService.getAllChildren([iri])).pipe(
      map(([sa, children]) => {
        let style = sa.filter(tis => tis.concept == iri).reduce((result,next)=>{
          result["background-color"] = next["background-color"] || result["background-color"];
          result["border-color"] = next["border-color"] || result["border-color"];
          result.color = next.color || result.color;
          result.icons = result.icons.concat(next.icons);
          result["text-decoration"] = next["text-decoration"] || result["text-decoration"];
          result["opacity"] = next["opacity"] || result["opacity"];
          return result;
        },this.getEmptyStyle(iri));
        let bubbleIcons:TreeItemIcon[] = children.map(childiri => sa.filter(tis => tis.concept == childiri)) //array of child style arrays
          .reduce((result,next)=>result = result.concat(next),[]) //array of child styles
          .map(tis => tis.icons.filter(icon => icon["bubble-up"]).map(icon => icon["bubble-up"])) //array of bubble icons of child style array
          .reduce((result,next)=>result = result.concat(next),[]);
        style.bubbleicons=bubbleIcons;
        return style;
      })
    );
  }

  public getIcons(style:TreeItemStyle):TreeItemIcon[]{
    let icons = style.icons.filter(icon => icon.type);
    if (!style.bubbleicons) return icons;
    let bi = style.bubbleicons.filter((value, index, self) => {
      return self.map(icon => icon.id).indexOf(value.id) === index;
    });
    return icons.concat(bi);
  }
}

export interface TreeItemStyle {
  "concept":string,
  "text-decoration"?:string,
  "color"?: string,
  "background-color"?: string,
  "border-color"?: string,
  "opacity"?:number,
  "icons": TreeItemIcon[],
  "bubbleicons"?: TreeItemIcon[]
}

export interface TreeItemIcon {
  "id": string,
  "style":TreeItemStyle,
  "iconName"?:string,
  "color"?: string,
  "background-color"?: string,
  "border-color"?: string,
  "text"?: string,
  "type"?: "dot" | "chip" | "imgIcon" | "smallImgIcon",
  "bubble-up"?: TreeItemIcon,
  "description"?: string
}