import { Component, OnInit, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItemAttributes } from '../services/queries/treeitems.service';
import { TreeDataService } from '../services/tree-data.service';
import { TreeStyleService } from "../services/tree-style.service";

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css']
})
export class TreeComponent implements OnInit {
  @Input() width:number;  
  @Output() claimWidth = new EventEmitter<number>();
  private treeItems$:Observable<TreeItemAttributes[]>;
  public searchResultCount;
  public searchDivOpened=false;
  constructor(
    private route: ActivatedRoute,
    public treeDataService: TreeDataService,
    public treeStyleService: TreeStyleService,
    private router: Router,
    private el: ElementRef  
  ){}

  ngOnInit() {    
    this.treeDataService.init(this.route,(width)=>this.claimWidth.emit(width));
    this.treeStyleService.registerTreeDomElement(this.el.nativeElement);
    this.treeDataService.getSearchResultCount$().subscribe(count => this.searchResultCount = count);
  }


  public performSearch(pattern:string){
    this.router.navigate([],{queryParams: {searchpattern: pattern}, queryParamsHandling: "merge" });
    return false;
  }
  public clearSearch(){
    this.router.navigate([],{ queryParams: {searchpattern: null}, queryParamsHandling: "merge" });
    return false;   
  }
  public onscroll(event){
    this.treeStyleService.onTreeScroll(event.target.scrollTop);
  }
}