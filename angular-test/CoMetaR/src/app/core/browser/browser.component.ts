import { Component, OnInit, NgZone } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { trigger, transition, style, query, animateChild, group, animate, state } from '@angular/animations';
import { DataService } from '../../services/data.service';
import { MatSnackBar, MatSnackBarConfig, MatIconRegistry } from '@angular/material';
import { BrowserService } from '../services/browser.service';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('Details => *, Provenance => UploadClientConfiguration, Provenance => SPARQL, UploadClientConfiguration => SPARQL, * => Statistics', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
          })
        ]),
        query(':enter', [
          style({ left: '100%'})
        ]),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [
            animate('300ms ease-out', style({ left: '-100%'}))
          ], { optional: true }),
          query(':enter', [
            animate('300ms ease-out', style({ left: '0%'}))
          ])
        ]),
        query(':enter', animateChild()),
      ]),
      transition('* => Details, UploadClientConfiguration => Provenance, SPARQL => UploadClientConfiguration, SPARQL => Provenance, Statistics => *', [
        style({ position: 'relative' }),
        query(':enter, :leave', [
          style({
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%'
          })
        ]),
        query(':enter', [
          style({ left: '-100%'})
        ]),
        query(':leave', animateChild(), { optional: true }),
        group([
          query(':leave', [
            animate('300ms ease-out', style({ left: '100%'}))
          ], { optional: true }),
          query(':enter', [
            animate('300ms ease-out', style({ left: '0%'}))
          ])
        ]),
        query(':enter', animateChild()),
      ])
    ]),
    trigger('changeWidth',[
      state('*', style({
        width: '{{startWidth}}px',
      }),{
        params: { startWidth: 0 }
      }),
      transition('* => *', [
        animate('300ms ease-in', style({
          width: '{{newWidth}}px',
        }))
      ],{
        params: { newWidth: 0 }
      }), 
    ])
  ]
})
export class BrowserComponent implements OnInit {
  title = 'CoMetaR';

  public width = 500;
  public resizeToogle = false;
  public newWidth = 0;
  public activatedRoute;
  constructor(
    private route:ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private browserService: BrowserService,
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer,
    private zone: NgZone
  ) { 
    iconRegistry.addSvgIcon('history', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-history-24px.svg'));
    iconRegistry.addSvgIcon('client-configuration', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-settings_ethernet-24px.svg'));
    iconRegistry.addSvgIcon('sparql', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-question_answer-24px.svg'));
    iconRegistry.addSvgIcon('statistics', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-timeline-24px.svg'));
  }

  ngOnInit() {
    if (this.router.url.match(/\/[^\/]+\/[^\/]+/)) {
      this.router.navigate(["/details"],{queryParams: {concept: this.router.url.split("/")[1]+":"+this.router.url.split("/")[2]} });
    }
    this.browserService.snackbarNotification.subscribe((notification)=> {
      /*this.snackBar.open(notification[0], notification[1], {
        duration: notification[1]=='error'?0:2000,
      });*/
      this.snackBar.openFromComponent(SnackbarComponent, {
        data: notification,
        duration: notification[1]=='error'?10000:2000,
        horizontalPosition: "right",
        verticalPosition: "bottom"
      });
    });
  }
  
  private savedX;
  private boundResizeFunction;

  public onTreeResizeStart(event: MouseEvent) {
    event.stopPropagation();
    this.savedX = event.clientX;
    this.boundResizeFunction = this.onTreeResizeDrag.bind(this);
    this.zone.runOutsideAngular(() => {
      window.document.addEventListener('mousemove', this.boundResizeFunction);
    });
    return false;
  }
  public onTreeResizeDrag(event: MouseEvent) {  
    this.zone.run(() => {
      event.stopPropagation();
      let diff = event.clientX - this.savedX;
      this.savedX += diff;
      this.width += diff;
      return false;
    });  
  }
  public onTreeResizeEnd(event: MouseEvent) {
    window.document.removeEventListener('mousemove', this.boundResizeFunction);
  }

  public navigateModule(source:string){    
    this.router.navigate([source],{ queryParamsHandling: "merge" });
  }

  public prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  public onRouterOutletActivate(outlet: RouterOutlet) {
    outlet.activatedRoute.url.pipe(map(data => data[0] && data[0].path || "")).subscribe(data => this.activatedRoute = data);
  }

  public onClaimWidth(width){
    this.newWidth = width;
    this.resizeToogle=!this.resizeToogle;
    this.width = width;
  }
}
