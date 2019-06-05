import { Component, OnInit, ElementRef, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TreeItemAttributes } from '../services/queries/treeitems.service';
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService } from "../services/tree-style.service";
import { combineLatest } from 'rxjs/operators';
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TreeComponent implements OnInit {
  @Input() width:number;  
  @Output() claimWidth = new EventEmitter<number>();
  private treeItems$:Observable<TreeItemAttributes[]>;
  constructor(
    private route: ActivatedRoute,
    public treeDataService: TreeDataService,
    public treeStyleService: TreeStyleService,
    private el: ElementRef,
    private cd: ChangeDetectorRef
  ){}

  ngOnInit() {    
    this.treeDataService.init(this.route,(width)=>this.claimWidth.emit(width));
    this.treeStyleService.registerTreeDomElement(this.el.nativeElement);
    this.treeStyleService.scrollHeadingsSubject$.subscribe(()=>this.cd.markForCheck())
  }

  public onscroll(event){
    this.treeStyleService.onTreeScroll(event.target.scrollTop);
  }

  public scrollTo(outlineElement){
    let tree = Array.from((<HTMLElement>this.el.nativeElement).children).filter(c => c.id == "tree")[0];
    tree.scrollTop=outlineElement.top*tree.scrollHeight-tree.clientHeight/2+31*tree.clientHeight/tree.scrollHeight/2;
  }
}