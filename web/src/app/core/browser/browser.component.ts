import { Component, OnInit, NgZone, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { trigger, transition, style, query, animateChild, group, animate, state } from '@angular/animations';
import { DataService } from '../../services/data.service';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BrowserService } from '../services/browser.service';
import { SnackbarComponent } from '../snackbar/snackbar.component';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer } from '@angular/platform-browser';
import { TreeStyleService } from '../services/tree-style.service';
import { ProgressService } from 'src/app/services/progress.service';
import { ConfigurationService } from 'src/app/services/configuration.service';

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
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BrowserComponent implements OnInit {
  title = 'CoMetaR';

  public width = 500;
  public left = 0;
  public resizeToogle = false;
  public newWidth = 0;
  public activatedRoute;
  public runningTask=false;
  public taskProgress=0;
  constructor(
    private route:ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private snackBar: MatSnackBar,
    private browserService: BrowserService,
    private treeStyleService: TreeStyleService,
    private progressService: ProgressService,
    private configurationService:ConfigurationService,
    iconRegistry: MatIconRegistry, 
    sanitizer: DomSanitizer,
    private cd: ChangeDetectorRef,
    private zone: NgZone
  ) { 
    iconRegistry.addSvgIcon('history', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-history-24px.svg'));
    iconRegistry.addSvgIcon('client-configuration', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-settings_ethernet-24px.svg'));
    iconRegistry.addSvgIcon('sparql', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-question_answer-24px.svg'));
    iconRegistry.addSvgIcon('statistics', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/baseline-timeline-24px.svg'));
    iconRegistry.addSvgIcon('expandTree', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/arrow_forward_ios-24px.svg'));
    iconRegistry.addSvgIcon('collapseTree', sanitizer.bypassSecurityTrustResourceUrl('assets/img/icons/arrow_back_ios-24px.svg'));
    this.progressService.moduleTaskProgress$.subscribe(data => this.taskProgress=data?data:0);
    this.progressService.moduleTaskRunning$.subscribe(data => this.runningTask = data);
  }

  ngOnInit() {
    if (this.router.url.match(/\/[^\/]+\/[^\/]+/)) {
      this.router.navigate(["/details"],{queryParams: {concept: this.router.url.split("/")[1]+":"+this.router.url.split("/")[2]}, replaceUrl: true });
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
    window.onresize = ()=>{this.onWindowResize()};
    this.onWindowResize();
  }
  
  private savedX;
  private savedRelativeTreeScrolltop;
  private boundResizeFunction;
  private dragging = false;
  private minTreeWidth=300;
  private minModuleWidth=400;
  private treeOverlayThreshold=1000;
  private minModuleWidthAtThreshold=100;
  public treeAsOverlay=false;
  public treeScrolledIn=false;

  public onTreeResizeStart(event: MouseEvent) {
    event.stopPropagation();
    this.scrollInTree();
    this.savedX = event.clientX;
    let tree = document.getElementById("tree");
    this.savedRelativeTreeScrolltop = tree.scrollTop/tree.scrollHeight;
    this.boundResizeFunction = this.onTreeResizeDrag.bind(this);
    this.zone.runOutsideAngular(() => {
      this.dragging=true;
      window.document.addEventListener('mousemove', this.boundResizeFunction);
    });
    this.treeExpanded=true;
    return false;
  }
  private scrollInterval=100;
  public onTreeResizeDrag(event: MouseEvent) {  
    this.zone.run(() => {
      event.stopPropagation();
      let diff = event.clientX - this.savedX;
      diff = Math.floor((diff+this.scrollInterval/2)/this.scrollInterval)*this.scrollInterval;
      if (!this.treeAsOverlay) diff = Math.min(window.innerWidth-this.minModuleWidth-this.width,diff);
      else diff = Math.min(window.innerWidth-this.width-this.minModuleWidthAtThreshold,diff);
      diff = Math.max(this.minTreeWidth-this.width,diff);
      this.savedX += diff;
      this.width += diff;
      let tree = document.getElementById("tree");
      tree.scrollTop = tree.scrollHeight*this.savedRelativeTreeScrolltop;
      this.cd.markForCheck();
      return false;
    });  
  }
  public onTreeResizeEnd(event: MouseEvent) {
    if (this.dragging) {
      window.document.removeEventListener('mousemove', this.boundResizeFunction);
      this.dragging = false;
      this.browserService.onResize();
    }
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

  public devServer():boolean {
    return this.configurationService.getServer()=='dev';
  }

  public treeExpanded:boolean=false;
  public expandOrCollapseTreeContainer(event: MouseEvent){
    event.stopPropagation();
    let tree = document.getElementById("tree");
    this.savedRelativeTreeScrolltop = tree.scrollTop/tree.scrollHeight;
    if (!this.treeExpanded || this.treeAsOverlay && !this.treeScrolledIn) {
      this.savedX = this.width;
      if (this.treeAsOverlay) {
        this.scrollInTree();
        this.width=Math.round(Math.max(window.innerWidth-this.minModuleWidthAtThreshold,this.minTreeWidth));
      }
      else {
        this.width=Math.round(Math.max(Math.min(window.innerWidth-this.minModuleWidth,window.innerWidth*0.8),this.minTreeWidth));
      }
      this.treeExpanded=true;
    }
    else {
      this.treeExpanded=false;      
      if (this.treeAsOverlay) {
        this.width=this.minTreeWidth;
        this.scrollOutTree();
      }
      else this.width=this.savedX;
    }
    setTimeout(()=>{
      tree.scrollTop = tree.scrollHeight*this.savedRelativeTreeScrolltop;
      this.browserService.onResize();
    },0);
    return false;
  }

  private scrollInTree(){
    this.left=0;
    this.treeScrolledIn=true;
  }
  private scrollOutTree(){
    this.left=this.minTreeWidth*(-1)+20;
    this.width=this.minTreeWidth;
    this.treeScrolledIn=false;
  }

  private onWindowResize(){
    this.browserService.onResize();
    this.width=Math.max(Math.min(this.width, window.innerWidth*0.8,window.innerWidth-this.minModuleWidth),this.minTreeWidth);
    if (window.innerWidth<this.treeOverlayThreshold) {
      this.scrollOutTree();
      this.treeAsOverlay=true;
    }
    else {
      this.scrollInTree();
      this.treeAsOverlay=false;
    }
  }

  provenanceModuleActivated(){
    return this.configurationService.settings.modules.provenance.active
  }

  sparqlModuleActivated(){
    return this.configurationService.settings.modules.sparql.active
  }

  clientConfigurationModuleActivated(){
    return this.configurationService.settings.modules['client-configuration'].active
  }
}
