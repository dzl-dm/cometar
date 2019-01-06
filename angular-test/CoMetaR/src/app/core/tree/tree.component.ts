import { Component, OnInit, ElementRef, Input } from '@angular/core';
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
  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchResultCount;
  constructor(
    private route: ActivatedRoute,
    private treeDataService: TreeDataService,
    private treeStyleService: TreeStyleService,
    private router: Router,
    private el: ElementRef  
  ){}

  ngOnInit() {    
    this.treeDataService.setRoute(this.route);
    this.treeStyleService.registerTreeDomElement(this.el.nativeElement);
    this.treeDataService.getSearchResultCount$().subscribe(count => this.searchResultCount = count);
  }


  private performSearch(pattern:string){
    this.router.navigate([],{queryParams: {searchpattern: pattern}, queryParamsHandling: "merge" });
    return false;
  }
  private clearSearch(){
    this.router.navigate([],{ queryParams: {searchpattern: null}, queryParamsHandling: "merge" });
    return false;   
  }
  private onscroll(event){
    this.treeStyleService.onTreeScroll(event.target.scrollTop);
  }
}