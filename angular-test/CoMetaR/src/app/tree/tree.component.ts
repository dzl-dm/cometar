import { Component, OnInit, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { TreeItemsService, TreeItemAttributes } from '../services/queries/treeitems.service';
import { TreeService } from '../services/tree.service';
import { map } from 'rxjs/operators';
import { routerNgProbeToken } from '@angular/router/src/router_module';

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css']
})
export class TreeComponent implements OnInit {
  private treeItems$:Observable<TreeItemAttributes[]>;
  constructor(
    private route: ActivatedRoute,
    private treeService: TreeService,
    private router: Router
  ){}

  ngOnInit() {    
    this.treeService.setRoute(this.route);
    this.treeItems$ = this.treeService.getTopLevelItems();
  }

  private performSearch(pattern:string){
    this.router.navigate(['/'],{queryParams: {searchpattern: pattern}, relativeTo: this.route});
    return false;
  }
}