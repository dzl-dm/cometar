import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TreeStyleService {

  constructor() { }

  private maxLeft=0;
  private updateWidthSubject = new BehaviorSubject<number>(this.maxLeft);
  private treeDomElement:HTMLElement;
  public registerTreeDomElement(el:HTMLElement){
    Array.from(el.children).forEach((child:HTMLElement) => {
      if (child.getAttribute('id') == "tree") {
        this.treeDomElement = child;
      }
    });
  }
  public updateInformationDivMaxLeft(el:HTMLElement):Observable<number>{
    let left = this.getPosition(el).x;
    if (this.maxLeft < left) this.updateWidthSubject.next(left);
    this.maxLeft = Math.max(this.maxLeft,left);
    return this.updateWidthSubject.pipe(map(newMaxLeft => newMaxLeft - left));
  }
  private getPosition(el:HTMLElement) {
    if (!el) return;
    let xPos = 0;
    let yPos = 0;
    while (el != this.treeDomElement) {
      xPos += (el.offsetLeft - el.scrollLeft + el.clientLeft);
      yPos += (el.offsetTop - el.scrollTop + el.clientTop);
      el = <HTMLElement> el.offsetParent;
    }
    return {
      x: xPos,
      y: yPos
    };
  }

  public scrollHeadingsSubject$ = new Subject<string[]>();
  public onTreeScroll(scrollTop:number){
    let scrollHeadings:string[]=[];   
    let visibleListItem:HTMLElement = this.treeDomElement;
    let foundChild = true;

    while (foundChild){
      foundChild=false;
      let childlist = this.getList(visibleListItem);
      if (childlist) Array.from(this.getListItems(childlist)).forEach((childlistitem:HTMLElement) => {
        if (foundChild)return;
        let adjustedScrollTop = scrollTop+scrollHeadings.length*25;
        if (this.getPosition(childlistitem).y < adjustedScrollTop && childlistitem.offsetHeight+this.getPosition(childlistitem).y-25 > adjustedScrollTop){
          visibleListItem = childlistitem;
          scrollHeadings.push(this.getTitle(visibleListItem));
          foundChild=true;
        }
      });
    }
    this.scrollHeadingsSubject$.next(scrollHeadings);
  }
  private getTopChild(listitem:HTMLElement,scrollTop):HTMLElement{
    let topchild:HTMLElement;
    return topchild;
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
  private getTitle(listitem:HTMLElement):string{
    return listitem.getElementsByClassName("treeItemHeading")[0].getElementsByClassName("treeItemTitle")[0].textContent;
  }
}
