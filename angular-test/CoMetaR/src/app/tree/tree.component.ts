import { Component, OnInit, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItemAttributes } from '../services/queries/treeitems.service';
import { TreeService } from '../services/tree.service';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css']
})
export class TreeComponent implements OnInit {
  private treeItems$:Observable<TreeItemAttributes[]>;
  private searchResultCount;
  constructor(
    private route: ActivatedRoute,
    private treeService: TreeService,
    private router: Router,
    private el: ElementRef  
  ){}

  ngOnInit() {    
    this.treeService.setRoute(this.route);
    this.treeService.registerTreeDomElement(this.el.nativeElement);
    this.treeService.getSearchResultCount$().subscribe(count => this.searchResultCount = count);
  }


  private performSearch(pattern:string){
    this.router.navigate([],{queryParams: {searchpattern: pattern},relativeTo: this.route});
    return false;
  }
  private clearSearch(){
    this.router.navigate([],{relativeTo: this.route});
    return false;   
  }
  private onscroll(event){
    this.treeService.onTreeScroll(event.target.scrollTop);
  }
}