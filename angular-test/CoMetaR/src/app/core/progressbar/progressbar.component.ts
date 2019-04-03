import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DataService } from 'src/app/services/data.service';
import { ProgressService } from 'src/app/services/progress.service';

@Component({
  selector: 'app-progressbar',
  templateUrl: './progressbar.component.html',
  styleUrls: ['./progressbar.component.css']
})
export class ProgressbarComponent implements OnInit {

  public progressMode="determinate";
  public progressValue=0;

  constructor(
    private cd: ChangeDetectorRef,
    private progressService: ProgressService
  ) { }

  ngOnInit() {
  }

  ngAfterViewInit(){
    this.progressService.progress.subscribe(progress => {
      this.progressValue = progress;
      this.cd.detectChanges();
    });
    /*this.dataService.queryOpened$.subscribe(next => {
      this.progressTodo+=next;
      this.progressValue = Math.floor(this.progressDone/this.progressTodo*100);
      this.cd.detectChanges();
    });
    this.dataService.queryClosed$.subscribe(next => {
      this.progressDone+=next;
      this.progressValue = Math.floor(this.progressDone/this.progressTodo*100);
      this.cd.detectChanges();
      if (this.progressDone >= this.progressTodo){
        this.progressDone = 0;
        this.progressTodo = 0;
        this.progressValue = 0;
      }
    });*/
  }
}
