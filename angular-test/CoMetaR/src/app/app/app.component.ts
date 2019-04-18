import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public browserCheckIE = false;
  constructor() {
    let ua = navigator.userAgent;
    if (ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1) this.browserCheckIE=true;
  }

  ngOnInit() {
  }

}
