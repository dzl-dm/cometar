import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { trigger, transition, style, query, animateChild, group, animate } from '@angular/animations';

@Component({
  selector: 'app-browser',
  templateUrl: './browser.component.html',
  styleUrls: ['./browser.component.css'],
  animations: [
    trigger('routeAnimations', [
      transition('Details => Provenance', [
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
        query(':leave', animateChild()),
        group([
          query(':leave', [
            animate('300ms ease-out', style({ left: '-100%'}))
          ]),
          query(':enter', [
            animate('300ms ease-out', style({ left: '0%'}))
          ])
        ]),
        query(':enter', animateChild()),
      ]),
      transition('Provenance => Details', [
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
        query(':leave', animateChild()),
        group([
          query(':leave', [
            animate('300ms ease-out', style({ left: '100%'}))
          ]),
          query(':enter', [
            animate('300ms ease-out', style({ left: '0%'}))
          ])
        ]),
        query(':enter', animateChild()),
      ])
    ])
  ]
})
export class BrowserComponent implements OnInit {
  title = 'CoMetaR';

  private width = 500;
  constructor(
    private route:ActivatedRoute,
    private router: Router,
  ) { }

  ngOnInit() {
  }
  
  private savedX;
  private treeResizing=false;

  private onTreeResizeStart(event: MouseEvent) {
    event.stopPropagation();
    this.treeResizing = true;
    this.savedX = event.clientX;
    return false;
  }
  private onTreeResizeDrag(event: MouseEvent) {    
    if (!this.treeResizing) return true;
    event.stopPropagation();
    let diff = event.clientX - this.savedX;
    this.savedX += diff;
    this.width += diff;
    return false;
  }
  private onTreeResizeEnd(event: MouseEvent) {
    this.treeResizing = false;
  }

  private navigateModule(source:string){    
    this.router.navigate([source],{ queryParamsHandling: "merge" });
  }

  private prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }

  private onClaimWidth(event){
    console.log(event);
  }
}
