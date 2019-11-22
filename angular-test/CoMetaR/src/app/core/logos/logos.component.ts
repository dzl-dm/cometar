import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Observable, Subject, BehaviorSubject, combineLatest } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logos',
  templateUrl: './logos.component.html',
  styleUrls: ['./logos.component.css']
})
export class LogosComponent implements OnInit {

  public loadingStatus$:Observable<boolean>;
  private refreshTooltip$ = new BehaviorSubject<boolean>(true);
  public tooltip;
  private refreshTimeout;
  constructor(
    private dataService:DataService,
    private router:Router,
    private cd: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.loadingStatus$=this.dataService.loading;
    this.refreshTooltip();
    combineLatest(this.dataService.loadingNames,this.refreshTooltip$).subscribe(data => {
      this.tooltip = "Loading... \r\n" + data[0].map((message,index) => "("+Math.floor((new Date().valueOf() - this.dataService.busyQueriesStartTimes[index])/1000) + ") " + message).join(",\r\n");
      this.cd.markForCheck();
    });
  }

  private refreshTooltip(){
    this.refreshTimeout = setTimeout(()=>{
      this.refreshTooltip$.next(true);
      this.refreshTimeout = this.refreshTooltip();
    },1000)
  }

  public navigateModule(url?:string){   
    if (url) window.open(url);
    else this.router.navigate(["/"]);
  }
}
