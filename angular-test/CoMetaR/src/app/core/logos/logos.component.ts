import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DataService } from 'src/app/services/data.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-logos',
  templateUrl: './logos.component.html',
  styleUrls: ['./logos.component.css']
})
export class LogosComponent implements OnInit {

  public loadingStatus$:Observable<boolean>;
  constructor(
    private dataService:DataService,
    private router:Router
  ) { }

  ngOnInit() {
    this.loadingStatus$=this.dataService.loading;
  }

  public navigateModule(){    
    this.router.navigate(["/"]);
  }
}
