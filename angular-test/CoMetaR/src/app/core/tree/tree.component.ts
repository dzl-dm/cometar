import { Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService } from "../services/tree-style.service";
import { combineLatest } from 'rxjs/operators';
import { ChangeDetectionStrategy } from '@angular/core';
import { ProgressService } from 'src/app/services/progress.service';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeComponent implements OnInit {
  @Input() width:number;  
  @Output() claimWidth = new EventEmitter<number>();
  public runningTask$ = this.progressService.treeTaskRunning$;
  public taskProgress=0;
  private taskRefreshInterval;
  constructor(
    private route: ActivatedRoute,
    public treeDataService: TreeDataService,
    public treeStyleService: TreeStyleService,
    private progressService: ProgressService,
    private el: ElementRef,
    private cd: ChangeDetectorRef
  ){
    this.progressService.treeTaskProgress$.subscribe(data => this.taskProgress=data);
    this.runningTask$.subscribe(running => {
      if (running) this.taskRefreshInterval = setInterval(()=>{this.cd.markForCheck()},500);
      else clearInterval(this.taskRefreshInterval);
    });
  }

  ngOnInit() {    
    this.treeDataService.init(this.route,(width)=>this.claimWidth.emit(width));
    this.treeStyleService.registerTreeDomElement(this.el.nativeElement);
    //this.treeStyleService.scrollHeadingsSubject$.subscribe(()=>this.cd.markForCheck());
  }

  public onscroll(event){
    this.treeStyleService.onTreeScroll(event.target.scrollTop);
  }

  public scrollTo(outlineElement, scrollHeadings:HTMLElement){
    let tree = Array.from((<HTMLElement>this.el.nativeElement).children).filter(c => c.id == "tree")[0];
    tree.scrollTop=Math.min(outlineElement.top*tree.scrollHeight,outlineElement.top*tree.scrollHeight-tree.clientHeight/2+(outlineElement.height?outlineElement.height:31)*tree.scrollHeight/2);
    setTimeout(()=>tree.scrollTop=Math.min(outlineElement.top*tree.scrollHeight-scrollHeadings.offsetHeight,outlineElement.top*tree.scrollHeight-tree.clientHeight/2+(outlineElement.height?outlineElement.height:31)*tree.scrollHeight/2),0);
  }

  public getOfTrue(){
    return of(true);
  }

  public getTreePanelHeight(treeHeight:number):number{
    let rootTreeItemList = (<HTMLElement>(<HTMLElement>this.el.nativeElement).getElementsByClassName("topLevel")[0]).offsetHeight || 0;
    return Math.min(rootTreeItemList, treeHeight);
  }
}