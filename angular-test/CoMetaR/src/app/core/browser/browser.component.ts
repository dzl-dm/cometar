import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { trigger, transition, style, query, animateChild, group, animate, state } from '@angular/animations';
import { DataService } from '../../services/data.service';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material';
import { BrowserService } from '../services/browser.service';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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
    private browserService: BrowserService
  ) { }

  ngOnInit() {
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
  private treeResizing=false;

  public onTreeResizeStart(event: MouseEvent) {
    event.stopPropagation();
    this.treeResizing = true;
    this.savedX = event.clientX;
    return false;
  }
  public onTreeResizeDrag(event: MouseEvent) {    
    if (!this.treeResizing) return true;
    event.stopPropagation();
    let diff = event.clientX - this.savedX;
    this.savedX += diff;
    this.width += diff;
    return false;
  }
  public onTreeResizeEnd(event: MouseEvent) {
    this.treeResizing = false;
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
