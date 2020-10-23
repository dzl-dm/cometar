import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { map, skip } from 'rxjs/operators';
import { ConfigurationService } from '../services/configuration.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  public browserCheckIE = false;
  constructor(
    private route: ActivatedRoute,
    private configurationService:ConfigurationService
  ) {
    let ua = navigator.userAgent;
    if (ua.indexOf('MSIE ') > -1 || ua.indexOf('Trident/') > -1) this.browserCheckIE=true;

    let obs = this.route.queryParamMap;
    if (document.location.href.indexOf("?dev=")>-1 || document.location.href.indexOf("&dev=")>-1) obs=obs.pipe(skip(1));
    obs.subscribe(data => {
      if (data.get('dev') && data.get('dev').startsWith("t")) {
        window.document.documentElement.style.setProperty('--first-color', 'rgb(139, 182, 39)');
        window.document.documentElement.style.setProperty('--second-color', 'rgb(173, 185, 145)');
        window.document.documentElement.style.setProperty('--second-color-transparent', 'rgba(158, 190, 81, 0.5)');
        this.configurationService.setServer('dev');
      }
      else {
        window.document.documentElement.style.setProperty('--first-color', '#0492D0');
        window.document.documentElement.style.setProperty('--second-color', '#BFE3F2');
        window.document.documentElement.style.setProperty('--second-color-transparent', 'rgba(103, 174, 204, 0.5)');
        this.configurationService.setServer('live');
      } 
    });    
  }

  ngOnInit() {
  }

}
