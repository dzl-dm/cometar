import { Component, OnInit, Input, ElementRef } from '@angular/core';
import { CommitDetails, CommitDetailsService } from '../services/queries/commit-details.service';
import { Observable } from 'rxjs';
import { TreeDataService } from 'src/app/core/services/tree-data.service';

@Component({
  selector: 'app-commit-details',
  templateUrl: './commit-details.component.html',
  styleUrls: ['./commit-details.component.css']
})
export class CommitDetailsComponent implements OnInit {
  @Input() commitid:string;
  constructor(
  ) { }

  ngOnInit() {
  }

}
